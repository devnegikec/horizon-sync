import * as React from 'react';

import { AlertCircle, Database, Plus, RefreshCw, Trash2 } from 'lucide-react';

import { Badge, Button, Checkbox, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { environment } from '../../../../environments/environment';
import { dataSyncService, type FeatureSummary, type SyncableFeature } from '../services/dataSyncService';

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
        <div key={result.key} className="flex items-center justify-between text-sm">
          <span>{result.label}</span>
          <Badge variant="outline">
            {result.summary ? `${result.summary.created ?? 0} created · ${result.summary.skipped ?? 0} skipped` : 'done'}
          </Badge>
        </div>
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
  const [items, setItems] = React.useState<Array<{ id: string; item_name: string; sku?: string | null; item_code?: string }>>([]);
  const [receiveAsnMode, setReceiveAsnMode] = React.useState<'items' | 'block_ids'>('items');
  const [receiveAsnItems, setReceiveAsnItems] = React.useState<ReceiveAsnRow[]>([]);
  const [receiveAsnQrType, setReceiveAsnQrType] = React.useState('dynamic');
  const [receiveAsnBlockIds, setReceiveAsnBlockIds] = React.useState('');
  const [receiveAsnType, setReceiveAsnType] = React.useState('purchase');
  const [receiveAsnTargetWarehouseId, setReceiveAsnTargetWarehouseId] = React.useState('');
  const [receiveAsnSourceWarehouseId, setReceiveAsnSourceWarehouseId] = React.useState('');

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
    const fetchItems = async () => {
      if (!accessToken) return;
      try {
        const url = `${environment.apiCoreUrl}/api/v1/items?page=1&page_size=100`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          const list: Array<{ id: string; item_name: string; sku?: string | null; item_code?: string }> = data.items || [];
          setItems(list);
          // Pre-populate the two known test items (resolved by SKU).
          const defaults = [
            { sku: 'PRE-COOK-5', batch: 'Batch-SEP-08-09-2026', quantity: '110', master_pack_size: '5' },
            { sku: 'PRE-COOK-10', batch: 'Batch-SEP-09-09-2026', quantity: '10', master_pack_size: '2' },
          ];
          setReceiveAsnItems(defaults.map((d) => {
            const match = list.find((i) => (i.sku ?? i.item_code ?? '') === d.sku);
            return { item_id: match?.id ?? '', batch: d.batch, quantity: d.quantity, master_pack_size: d.master_pack_size };
          }));
        }
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
    setReceiveAsnItems((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const addReceiveAsnItem = () => {
    setReceiveAsnItems((prev) => [...prev, { item_id: '', batch: '', quantity: '10', master_pack_size: '2' }]);
  };

  const removeReceiveAsnItem = (idx: number) => {
    setReceiveAsnItems((prev) => prev.filter((_, i) => i !== idx));
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
          items: receiveAsnMode === 'items'
            ? receiveAsnItems
              .filter((r) => r.item_id)
              .map((r) => ({
                item_id: r.item_id,
                batch: r.batch,
                quantity: Math.max(1, parseInt(r.quantity, 10) || 10),
                master_pack_size: Math.max(1, parseInt(r.master_pack_size, 10) || 2),
              }))
            : [],
          block_ids: receiveAsnMode === 'block_ids'
            ? receiveAsnBlockIds.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
          qr_type: receiveAsnQrType,
          asn_type: receiveAsnType,
          target_warehouse_id: receiveAsnTargetWarehouseId || undefined,
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
                          <Label className="text-xs">Master Pack</Label>
                          <Input type="number" min={1} value={row.master_pack_size} onChange={(e) => updateReceiveAsnItem(idx, 'master_pack_size', e.target.value)} disabled={!canEdit || syncing} />
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeReceiveAsnItem(idx)} disabled={!canEdit || syncing} className="h-9 px-2">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-end justify-between gap-3">
                      <Button variant="outline" size="sm" onClick={addReceiveAsnItem} disabled={!canEdit || syncing} className="gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        Add item
                      </Button>
                      <div className="w-[180px] space-y-1.5">
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
              <Button disabled={!canEdit || syncing || selectedKeys.length === 0} onClick={() => void handleSync()}>
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
