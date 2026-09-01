import * as React from 'react';

import { AlertCircle, Database, RefreshCw } from 'lucide-react';

import { Badge, Button, Checkbox, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';
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
        }
      } catch {
        // warehouse selector is best-effort
      }
    };
    void fetchWarehouses();
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleSync = async () => {
    if (selectedKeys.length === 0) return;
    setSyncing(true);
    setResults(null);
    try {
      const result = await dataSyncService.sync(
        accessToken,
        selectedKeys,
        'USD',
        selected['stock'] ? selectedWarehouseId : undefined
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
                <Label htmlFor="sync-warehouse">Stock warehouse</Label>
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
