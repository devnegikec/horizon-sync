import * as React from 'react';

import { AlertCircle, Info, RotateCcw, Save, SlidersHorizontal } from 'lucide-react';

import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '@horizon-sync/ui/components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@horizon-sync/ui/components/ui/tooltip';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { pickSettingsService, type PickConfigCatalogItem } from '../services/pickSettingsService';

export interface PickSettingsEditorProps {
  accessToken: string;
  canEdit: boolean;
}

function toListText(value: unknown): string {
  return Array.isArray(value) ? value.join(', ') : '';
}

function fromListText(text: string): string[] {
  return text
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function enumLabel(option: string): string {
  switch (option) {
    case 'fefo_fifo':
      return 'FEFO, then FIFO';
    case 'fifo':
      return 'FIFO (first in, first out)';
    case 'fixed_bin':
      return 'Fixed bin';
    case 'zone':
      return 'Zone';
    case 'per_item':
      return 'Per item';
    case 'always':
      return 'Always';
    case 'never':
      return 'Never';
    default:
      return option;
  }
}

interface SettingControlProps {
  item: PickConfigCatalogItem;
  value: unknown;
  disabled: boolean;
  onChange: (key: string, value: unknown) => void;
}

function SettingControl({ item, value, disabled, onChange }: SettingControlProps) {
  if (item.type === 'bool') {
    return <Switch checked={Boolean(value)} disabled={disabled} onCheckedChange={(checked) => onChange(item.key, checked)} />;
  }

  if (item.type === 'int' || item.type === 'numeric') {
    return (
      <Input type="number"
        inputMode="decimal"
        value={value === undefined || value === null ? '' : String(value)}
        disabled={disabled}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') {
            onChange(item.key, item.type === 'int' ? 0 : 0);
            return;
          }
          const parsed = Number(raw);
          if (!Number.isNaN(parsed)) {
            onChange(item.key, parsed);
          }
        }}
        className="w-32" />
    );
  }

  if (item.type === 'enum') {
    const current = String(value);
    return (
      <Select value={current} disabled={disabled} onValueChange={(next) => onChange(item.key, next)}>
        <SelectTrigger className="w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(item.allowed ?? []).map((option) => (
            <SelectItem key={option} value={option}>
              {enumLabel(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // list
  return (
    <Input value={toListText(value)}
      disabled={disabled}
      placeholder="Comma-separated values"
      onChange={(e) => onChange(item.key, fromListText(e.target.value))}
      className="w-full max-w-sm" />
  );
}

export function PickSettingsEditor({ accessToken, canEdit }: PickSettingsEditorProps) {
  const { toast } = useToast();
  const [catalog, setCatalog] = React.useState<PickConfigCatalogItem[]>([]);
  const [values, setValues] = React.useState<Record<string, unknown>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catalogData, settings] = await Promise.all([pickSettingsService.getCatalog(accessToken), pickSettingsService.getSettings(accessToken)]);
      setCatalog(catalogData);
      setValues(settings.settings ?? {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pick settings');
    } finally {
      setLoading(false);
      setDirty(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleChange = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await pickSettingsService.update(accessToken, values);
      setValues(result.settings ?? {});
      setDirty(false);
      toast({
        title: 'Pick settings saved',
        description: 'Configuration updated for this organization.',
      });
    } catch (err) {
      toast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Failed to save pick settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      const result = await pickSettingsService.reset(accessToken);
      setValues(result.settings ?? {});
      setDirty(false);
      toast({
        title: 'Pick settings reset',
        description: 'Overrides cleared — organization now uses defaults.',
      });
    } catch (err) {
      toast({
        title: 'Reset failed',
        description: err instanceof Error ? err.message : 'Failed to reset pick settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5" />
          Pick Configuration
        </CardTitle>
        <CardDescription>
          Tenant-scoped WMS pick rules. Values left at their default are shown as the default; saving a different value stores an override for this
          organization only.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
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
        ) : (
          <>
            <div className="space-y-1">
              {catalog.map((item) => (
                <div key={item.key} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{item.label}</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              aria-label={`More info about ${item.label}`}
                              className="inline-flex items-center rounded text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="start" className="max-w-xs">
                            <p className="text-xs">{item.description}</p>
                            <p className="mt-1.5 text-xs font-mono text-muted-foreground">pick.{item.key} · {item.type}</p>
                            <p className="text-xs font-mono text-muted-foreground">default: {JSON.stringify(item.default)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <div className="shrink-0">
                    <SettingControl item={item} value={values[item.key]} disabled={!canEdit || saving} onChange={handleChange} />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={!canEdit || saving} onClick={() => void handleReset()}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset to defaults
              </Button>
              <Button disabled={!canEdit || saving || !dirty} onClick={() => void handleSave()}>
                {saving ? (
                  'Saving…'
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save changes
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
