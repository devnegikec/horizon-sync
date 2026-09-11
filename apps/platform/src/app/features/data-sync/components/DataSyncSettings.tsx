import * as React from 'react';

import { AlertCircle, Check, Database, Plus, RefreshCw, Trash2 } from 'lucide-react';

import { Badge, Button, Checkbox, Input, Label, Popover, PopoverContent, PopoverTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { environment } from '../../../../environments/environment';
import { UserService } from '../../../services/user.service';
import { dataSyncService, type FeatureSummary, type ReceiveAsnStep, type SyncableFeature, type WarehouseUserAssignment } from '../services/dataSyncService';

export interface DataSyncSettingsProps {
  accessToken: string;
  canEdit: boolean;
}

interface FeatureResult {
  key: string;
  label: string;
  summary?: FeatureSummary;
  ok: boolean;
}

interface FeatureRowProps {
  feature: SyncableFeature;
  checked: boolean;
  disabled: boolean;
  onToggle: (key: string, checked: boolean) => void;
}

interface ReceiveAsnRow {
  item_id: string;
  batch: string;
  quantity: string;
  master_pack_size: string;
}

const INBOUND_STEPS: Array<{ key: ReceiveAsnStep; title: string; description: string }> = [
  {
    key: 'qr_blocks',
    title: 'Create QR block & batch',
    description: 'Generate QR blocks (with batch) for the configured items, or receive existing block IDs.',
  },
  {
    key: 'asn',
    title: 'Create ASN',
    description: 'Create and confirm an Advance Stock Notice from the QR block items.',
  },
  {
    key: 'receiving_slip',
    title: 'Generate receiving slip',
    description: 'Run the inbound scan session and produce a receiving slip.',
  },
  {
    key: 'put_away',
    title: 'Create put-away',
    description: 'Generate a put-away list from the receiving slip (Auto mode, auto-assigned worker).',
  },
];

function FeatureRow({ feature, checked, disabled, onToggle }: FeatureRowProps) {
  const inputId = `data-sync-${feature.key}`;
  return (
    <div className="flex items-start gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted/50">
      <Checkbox id={inputId}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onToggle(feature.key, value === true)}
        className="mt-0.5" />
      <Label htmlFor={inputId} className="flex cursor-pointer flex-col gap-0.5">
        <span className="text-sm font-medium">{feature.label}</span>
        <span className="text-xs font-normal text-muted-foreground">{feature.description}</span>
      </Label>
    </div>
  );
}

function SyncResults({ results }: { results: FeatureResult[] }) {
  if (results.length === 0) return null;
  return (
    <div className="space-y-1 rounded-md border border-border bg-muted/30 p-3">
      <p className="text-xs font-semibold uppercase text-muted-foreground">Last sync result</p>
      {results.map((result) => (
        <React.Fragment key={result.key}>
          <div className="flex items-center justify-between text-sm">
            <span>{result.label}</span>
            <Badge variant="outline">
              {result.summary?.put_away_count !== undefined
                ? `${result.summary.put_away_count} put-away list${result.summary.put_away_count === 1 ? '' : 's'}${result.summary.put_away_status ? ` · ${result.summary.put_away_status}` : ''}`
                : result.summary ? `${result.summary.created ?? 0} created · ${result.summary.skipped ?? 0} skipped` : 'done'}
            </Badge>
          </div>
          {((result.summary?.put_away_list_nos && result.summary.put_away_list_nos.length > 0)
            || result.summary?.put_away_list_no) && (
              <p className="text-xs text-muted-foreground">
                Put-away lists: {result.summary.put_away_list_nos?.join(', ') ?? result.summary.put_away_list_no}
              </p>
            )}
        </React.Fragment>
      ))}
    </div>
  );
}

export function DataSyncSettings({ accessToken, canEdit }: DataSyncSettingsProps) {
  const { toast } = useToast();
  const [features, setFeatures] = React.useState<SyncableFeature[]>([]);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [syncing, setSyncing] = React.useState(false);
  const [results, setResults] = React.useState<FeatureResult[] | null>(null);
  const [warehouses, setWarehouses] = React.useState<Array<{ id: string; name: string; code?: string }>>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = React.useState('');
  const [stockBoostQty, setStockBoostQty] = React.useState('100');
  const [items, setItems] = React.useState<Array<{ id: string; item_name: string; sku?: string | null; item_code?: string; items_per_master_pack?: number | null }>>([]);
  const [receiveAsnMode, setReceiveAsnMode] = React.useState<'items' | 'block_ids'>('items');
  const [receiveAsnSteps, setReceiveAsnSteps] = React.useState<Record<string, boolean>>({
    qr_blocks: true,
    asn: true,
    receiving_slip: true,
    put_away: false,
  });
  const [receiveAsnQrImage, setReceiveAsnQrImage] = React.useState(true);
  const [receiveAsnItems, setReceiveAsnItems] = React.useState<ReceiveAsnRow[]>([]);
  const [receiveAsnQrType, setReceiveAsnQrType] = React.useState('dynamic');
  const [receiveAsnBlockIds, setReceiveAsnBlockIds] = React.useState('');
  const [receiveAsnType, setReceiveAsnType] = React.useState('purchase');
  const [receiveAsnTargetWarehouseId, setReceiveAsnTargetWarehouseId] = React.useState('');
  const [receiveAsnSourceWarehouseId, setReceiveAsnSourceWarehouseId] = React.useState('');
  const [warehouseUserAssignments, setWarehouseUserAssignments] = React.useState<WarehouseUserAssignment[]>([]);
  const [selectedPutAwayWorkerIds, setSelectedPutAwayWorkerIds] = React.useState<string[]>([]);
  const [workerNames, setWorkerNames] = React.useState<Record<string, string>>({});
  const [workersLoading, setWorkersLoading] = React.useState(false);
  const [workersError, setWorkersError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const catalog = await dataSyncService.listFeatures(accessToken);
      setFeatures(catalog);
      setSelected(Object.fromEntries(catalog.map((feature) => [feature.key, false])));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data sync features');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    const fetchWarehouses = async () => {
      if (!accessToken) return;
      try {
        const url = `${environment.apiCoreUrl}/api/v1/warehouses?page=1&page_size=100&is_active=true&scope=all`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          const list: Array<{ id: string; name: string; code?: string }> = data.warehouses || [];
          setWarehouses(list);
          if (!selectedWarehouseId && list.length > 0) {
            setSelectedWarehouseId(list[0].id);
          }
          if (!receiveAsnTargetWarehouseId && list.length > 0) {
            setReceiveAsnTargetWarehouseId(list[0].id);
          }
        }
      } catch {
        // warehouse selector is best-effort
      }
    };
    void fetchWarehouses();
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    setSelectedPutAwayWorkerIds([]);
    setWarehouseUserAssignments([]);
    setWorkersError(null);
    if (!accessToken || !receiveAsnTargetWarehouseId) return;

    let cancelled = false;
    setWorkersLoading(true);
    void Promise.allSettled([
      dataSyncService.listWarehouseUsers(accessToken, receiveAsnTargetWarehouseId),
      UserService.getUsers(1, 100, accessToken),
    ]).then(([assignmentsResult, usersResult]) => {
      if (cancelled) return;
      if (assignmentsResult.status === 'rejected') {
        setWorkersError(assignmentsResult.reason instanceof Error
          ? assignmentsResult.reason.message
          : 'Failed to load workers for the selected warehouse.');
        return;
      }
      const assignments = Array.isArray(assignmentsResult.value) ? assignmentsResult.value : [];
      const usersResponse = usersResult.status === 'fulfilled' ? usersResult.value : null;
      const users = Array.isArray(usersResponse?.items)
        ? usersResponse.items
        : Array.isArray(usersResponse?.users) ? usersResponse.users : [];
      setWarehouseUserAssignments(assignments.filter((assignment) => assignment.user_id));
      setWorkerNames(Object.fromEntries(users.map((user) => [user.id, user.display_name || `${user.first_name} ${user.last_name}`.trim() || user.email])));
      if (usersResult.status === 'rejected') {
        setWorkersError('Workers loaded, but their names could not be loaded. User IDs are shown instead.');
      }
    }).finally(() => {
      if (!cancelled) setWorkersLoading(false);
    });

    return () => { cancelled = true; };
  }, [accessToken, receiveAsnTargetWarehouseId]);

  React.useEffect(() => {
    const fetchItems = async () => {
      if (!accessToken) return;
      try {
        const fetchPage = async (page: number) => {
          const url = `${environment.apiCoreUrl}/api/v1/items?page=${page}&page_size=100`;
          const response = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          });
          if (!response.ok) return null;
          return await response.json();
        };

        const firstPage = await fetchPage(1);
        if (!firstPage) return;
        let list: Array<{ id: string; item_name: string; sku?: string | null; item_code?: string }> = firstPage.items || [];
        const totalPages = firstPage.pagination?.total_pages ?? 1;
        for (let page = 2; page <= totalPages; page++) {
          const nextPage = await fetchPage(page);
          if (!nextPage) break;
          list = list.concat(nextPage.items || []);
        }
        setItems(list);
      } catch {
        // item selector is best-effort
      }
    };
    void fetchItems();
  }, [accessToken]);

  const selectedKeys = features.filter((feature) => selected[feature.key]).map((feature) => feature.key);

  const toggleFeature = (key: string, checked: boolean) => {
    setSelected((prev) => ({ ...prev, [key]: checked }));
  };

  const selectAll = () => {
    setSelected(Object.fromEntries(features.map((feature) => [feature.key, true])));
  };

  const clearAll = () => {
    setSelected(Object.fromEntries(features.map((feature) => [feature.key, false])));
  };

  const updateReceiveAsnItem = (idx: number, field: keyof ReceiveAsnRow, value: string) => {
    setReceiveAsnItems((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        if (field === 'item_id') {
          // Auto-populate Items per Master Pack from the selected item's base
          // packaging unit (same attribute Generate QR Block uses). If the
          // item has no master-pack size, leave any user-entered value as-is.
          const item = items.find((it) => it.id === value);
          const pack = item?.items_per_master_pack;
          return {
            ...r,
            item_id: value,
            master_pack_size:
              pack && pack > 0 ? String(pack) : r.master_pack_size,
          };
        }
        return { ...r, [field]: value };
      }),
    );
  };

  const addReceiveAsnItem = () => {
    setReceiveAsnItems((prev) => [...prev, { item_id: '', batch: '', quantity: '10', master_pack_size: '' }]);
  };

  const removeReceiveAsnItem = (idx: number) => {
    setReceiveAsnItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleInboundStep = (key: string, checked: boolean) => {
    setReceiveAsnSteps((prev) => {
      const next = { ...prev, [key]: checked };
      if (!checked) {
        // Unselecting a step also disables every later step (they depend on it).
        const idx = INBOUND_STEPS.findIndex((step) => step.key === key);
        for (let i = idx + 1; i < INBOUND_STEPS.length; i++) {
          next[INBOUND_STEPS[i].key] = false;
        }
      }
      return next;
    });
  };

  const handleSync = async () => {
    if (selectedKeys.length === 0) return;
    setSyncing(true);
    setResults(null);
    try {
      const result = await dataSyncService.sync(
        accessToken,
        selectedKeys,
        'USD',
        selected['stock'] ? selectedWarehouseId : undefined,
        selected['stock_boost'] ? Math.max(1, parseInt(stockBoostQty, 10) || 100) : undefined,
        selected['receive_asn'] ? {
          mode: receiveAsnMode,
          steps: INBOUND_STEPS.filter((step) => receiveAsnSteps[step.key]).map((step) => step.key),
          qr_image: receiveAsnQrImage,
          items: receiveAsnMode === 'items'
            ? receiveAsnItems
              .filter((r) => r.item_id)
              .map((r) => ({
                item_id: r.item_id,
                batch: r.batch,
                quantity: Math.max(1, parseInt(r.quantity, 10) || 10),
                master_pack_size: r.master_pack_size
                  ? Math.max(1, parseInt(r.master_pack_size, 10) || 1)
                  : 0,
              }))
            : [],
          block_ids: receiveAsnMode === 'block_ids'
            ? receiveAsnBlockIds.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
          qr_type: receiveAsnQrType,
          asn_type: receiveAsnType,
          target_warehouse_id: receiveAsnTargetWarehouseId || undefined,
          put_away_worker_ids: selectedPutAwayWorkerIds,
          source_warehouse_id: receiveAsnType === 'internal_transfer'
            ? (receiveAsnSourceWarehouseId || undefined)
            : undefined,
        } : undefined
      );
      const perFeature: FeatureResult[] = features
        .filter((feature) => selected[feature.key])
        .map((feature) => {
          const summary = result.summary?.[feature.key];
          return {
            key: feature.key,
            label: feature.label,
            summary: typeof summary === 'object' && summary !== null ? (summary as FeatureSummary) : undefined,
            ok: true,
          };
        });
      setResults(perFeature);
      toast({
        title: 'Data sync complete',
        description: result.message,
      });
    } catch (err) {
      toast({
        title: 'Data sync failed',
        description: err instanceof Error ? err.message : 'Failed to sync data',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const putAwayRequiresWorker = selected['receive_asn'] && receiveAsnSteps.put_away;
  const syncDisabled = !canEdit || syncing || selectedKeys.length === 0 || Boolean(putAwayRequiresWorker && selectedPutAwayWorkerIds.length === 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Sync
        </CardTitle>
        <CardDescription>
          Seed default master data on demand. Pick a category below and sync it — syncing is idempotent, so existing records are skipped and only
          missing data is created.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </div>
        ) : features.length === 0 ? (
          <p className="text-sm text-muted-foreground">No syncable data categories are available.</p>
        ) : (
          <>
            <div className="space-y-1">
              {features.map((feature) => (
                <FeatureRow key={feature.key}
                  feature={feature}
                  checked={Boolean(selected[feature.key])}
                  disabled={!canEdit || syncing}
                  onToggle={toggleFeature} />
              ))}
            </div>

            {selected['stock'] && (
              <div className="space-y-2 rounded-md border border-border p-3">
                <Label htmlFor="sync-warehouse">Warehouse</Label>
                <Select value={selectedWarehouseId}
                  onValueChange={setSelectedWarehouseId}
                  disabled={!canEdit || syncing}>
                  <SelectTrigger id="sync-warehouse" className="w-full">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name} ({wh.code ?? wh.id.slice(0, 8)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selected['stock_boost'] && (
              <div className="space-y-2 rounded-md border border-border p-3">
                <Label htmlFor="stock-boost-qty">Increase quantity per item</Label>
                <Input
                  id="stock-boost-qty"
                  type="number"
                  min={1}
                  value={stockBoostQty}
                  onChange={(e) => setStockBoostQty(e.target.value)}
                  disabled={!canEdit || syncing}
                  className="w-full"
                />
              </div>
            )}

            {selected['receive_asn'] && (
              <div className="space-y-3 rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">
                  Inbound Automation runs the selected steps in sequence — each step depends on the previous one.
                </p>

                {INBOUND_STEPS.map((step, index) => {
                  const stepSelected = Boolean(receiveAsnSteps[step.key]);
                  const previousSelected =
                    index === 0 || Boolean(receiveAsnSteps[INBOUND_STEPS[index - 1].key]);
                  return (
                    <div key={step.key} className="rounded-md border border-border bg-muted/20 p-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`inbound-step-${step.key}`}
                          checked={stepSelected}
                          disabled={!canEdit || syncing || !previousSelected}
                          onCheckedChange={(value) => toggleInboundStep(step.key, value === true)}
                          className="mt-0.5"
                        />
                        <Label htmlFor={`inbound-step-${step.key}`} className="flex cursor-pointer flex-col gap-0.5">
                          <span className="text-sm font-medium">
                            Step {index + 1}: {step.title}
                          </span>
                          <span className="text-xs font-normal text-muted-foreground">{step.description}</span>
                        </Label>
                      </div>

                      {stepSelected && step.key === 'qr_blocks' && (
                        <div className="mt-3 space-y-3 border-t border-border pt-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="receive-asn-mode">Mode</Label>
                              <Select
                                value={receiveAsnMode}
                                onValueChange={(v) => setReceiveAsnMode(v as 'items' | 'block_ids')}
                                disabled={!canEdit || syncing}>
                                <SelectTrigger id="receive-asn-mode" className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="items">Configured items</SelectItem>
                                  <SelectItem value="block_ids">Existing block IDs</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">QR type</Label>
                              <Select value={receiveAsnQrType} onValueChange={setReceiveAsnQrType} disabled={!canEdit || syncing}>
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="dynamic">Dynamic</SelectItem>
                                  <SelectItem value="static">Static</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Checkbox
                              id="receive-asn-qr-image"
                              checked={receiveAsnQrImage}
                              disabled={!canEdit || syncing}
                              onCheckedChange={(value) => setReceiveAsnQrImage(value === true)}
                            />
                            <Label htmlFor="receive-asn-qr-image" className="cursor-pointer text-sm">
                              Generate QR image after QR codes are created
                            </Label>
                          </div>

                          {receiveAsnMode === 'items' ? (
                            <div className="space-y-3">
                              {receiveAsnItems.map((row, idx) => (
                                <div key={idx} className="grid grid-cols-[1fr_1.4fr_70px_90px_auto] items-end gap-2">
                                  <div className="space-y-1.5">
                                    <Label className="text-xs">Item</Label>
                                    <Select value={row.item_id} onValueChange={(v) => updateReceiveAsnItem(idx, 'item_id', v)} disabled={!canEdit || syncing}>
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select item" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {items.map((it) => (
                                          <SelectItem key={it.id} value={it.id}>
                                            {it.item_name} ({it.sku ?? it.item_code ?? it.id.slice(0, 8)})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-xs">Batch (sequence auto-appended)</Label>
                                    <Input value={row.batch} onChange={(e) => updateReceiveAsnItem(idx, 'batch', e.target.value)} disabled={!canEdit || syncing} />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-xs">Qty</Label>
                                    <Input type="number" min={1} value={row.quantity} onChange={(e) => updateReceiveAsnItem(idx, 'quantity', e.target.value)} disabled={!canEdit || syncing} />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-xs">Items / Master Pack</Label>
                                    <Input
                                      type="number"
                                      min={1}
                                      placeholder="Auto"
                                      value={row.master_pack_size}
                                      onChange={(e) => updateReceiveAsnItem(idx, 'master_pack_size', e.target.value)}
                                      disabled={!canEdit || syncing}
                                    />
                                  </div>
                                  <Button variant="ghost" size="sm" onClick={() => removeReceiveAsnItem(idx)} disabled={!canEdit || syncing} className="h-9 px-2">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button variant="outline" size="sm" onClick={addReceiveAsnItem} disabled={!canEdit || syncing} className="gap-1">
                                <Plus className="h-3.5 w-3.5" />
                                Add item
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Label htmlFor="receive-asn-block-ids">Block IDs (comma-separated)</Label>
                              <Input
                                id="receive-asn-block-ids"
                                value={receiveAsnBlockIds}
                                onChange={(e) => setReceiveAsnBlockIds(e.target.value)}
                                placeholder="uuid1, uuid2, ..."
                                disabled={!canEdit || syncing}
                                className="font-mono"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {stepSelected && step.key === 'asn' && (
                        <div className="mt-3 space-y-3 border-t border-border pt-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">ASN Type</Label>
                              <Select value={receiveAsnType} onValueChange={setReceiveAsnType} disabled={!canEdit || syncing}>
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="purchase">Purchase</SelectItem>
                                  <SelectItem value="stock_receipt">Stock Receipt</SelectItem>
                                  <SelectItem value="internal_transfer">Internal Transfer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Target Warehouse</Label>
                              <Select value={receiveAsnTargetWarehouseId} onValueChange={setReceiveAsnTargetWarehouseId} disabled={!canEdit || syncing}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select warehouse" />
                                </SelectTrigger>
                                <SelectContent>
                                  {warehouses.map((wh) => (
                                    <SelectItem key={wh.id} value={wh.id}>
                                      {wh.name} ({wh.code ?? wh.id.slice(0, 8)})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {receiveAsnType === 'internal_transfer' && (
                              <div className="space-y-1.5">
                                <Label className="text-xs">Source Warehouse</Label>
                                <Select value={receiveAsnSourceWarehouseId} onValueChange={setReceiveAsnSourceWarehouseId} disabled={!canEdit || syncing}>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select warehouse" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {warehouses.map((wh) => (
                                      <SelectItem key={wh.id} value={wh.id}>
                                        {wh.name} ({wh.code ?? wh.id.slice(0, 8)})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {stepSelected && step.key === 'put_away' && (
                        <div className="mt-3 space-y-2 border-t border-border pt-3">
                          <Label htmlFor="receive-asn-put-away-workers">Put-away workers *</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                id="receive-asn-put-away-workers"
                                type="button"
                                variant="outline"
                                className="w-full justify-between font-normal"
                                disabled={!canEdit || syncing || workersLoading || !receiveAsnTargetWarehouseId}
                              >
                                <span className="truncate">
                                  {workersLoading
                                    ? 'Loading workers...'
                                    : selectedPutAwayWorkerIds.length > 0
                                      ? `${selectedPutAwayWorkerIds.length} worker${selectedPutAwayWorkerIds.length === 1 ? '' : 's'} selected`
                                      : 'Select at least one worker'}
                                </span>
                                <span className="ml-2 text-muted-foreground">⌄</span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
                              {workersError ? (
                                <p className="p-2 text-sm text-destructive">{workersError}</p>
                              ) : warehouseUserAssignments.length === 0 ? (
                                <p className="p-2 text-sm text-muted-foreground">
                                  {receiveAsnTargetWarehouseId ? 'No active workers found for this warehouse.' : 'Select a target warehouse first.'}
                                </p>
                              ) : (
                                <div className="max-h-56 space-y-1 overflow-y-auto">
                                  {warehouseUserAssignments.map((assignment) => {
                                    const selectedWorker = selectedPutAwayWorkerIds.includes(assignment.user_id);
                                    return (
                                      <label key={assignment.user_id} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted">
                                        <Checkbox
                                          checked={selectedWorker}
                                          onCheckedChange={(checked) => {
                                            setSelectedPutAwayWorkerIds((current) => checked === true
                                              ? [...current, assignment.user_id]
                                              : current.filter((id) => id !== assignment.user_id));
                                          }}
                                        />
                                        <span>{workerNames[assignment.user_id] ?? assignment.user_id}</span>
                                        {selectedWorker && <Check className="ml-auto h-4 w-4" />}
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </PopoverContent>
                          </Popover>
                          {workersError && (
                            <p className="text-xs text-destructive">{workersError}</p>
                          )}
                          {putAwayRequiresWorker && selectedPutAwayWorkerIds.length === 0 && (
                            <p className="text-xs text-destructive">Select at least one active worker before syncing.</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Select one or more active workers from the target warehouse. Each worker receives a separate put-away list.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {results && <SyncResults results={results} />}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" disabled={!canEdit || syncing} onClick={selectAll}>
                  Select all
                </Button>
                <Button variant="ghost" size="sm" disabled={!canEdit || syncing} onClick={clearAll}>
                  Clear
                </Button>
              </div>
              <Button disabled={syncDisabled} onClick={() => void handleSync()}>
                {syncing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Syncing…
                  </>
                ) : (
                  `Sync ${selectedKeys.length} selected`
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
