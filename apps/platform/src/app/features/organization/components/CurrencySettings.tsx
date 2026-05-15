import { useCallback, useEffect, useMemo, useState } from 'react';

import { type CellContext, type ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, Coins, Trash2 } from 'lucide-react';

import { ConfirmationDialog, EditableCell, EditableDataTable } from '@horizon-sync/ui/components';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { CurrencyService, type Currency, type CreateCurrencyPayload } from '../../../services/currency.service';

interface CurrencySettingsProps {
  accessToken: string;
  disabled?: boolean;
}

interface CurrencyRow {
  id: string;
  code: string;
  name: string;
  symbol: string;
  isNew?: boolean;
}

const EMPTY_ROW: CurrencyRow = { id: '', code: '', name: '', symbol: '', isNew: true };

function DeleteCell<TData>({ row, table }: CellContext<TData, unknown>) {
  const meta = table.options.meta as { deleteRow?: (index: number) => void } | undefined;
  if (!meta?.deleteRow) return null;
  return (
    <Button type="button"
      variant="ghost"
      size="sm"
      onClick={() => meta.deleteRow?.(row.index)}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}

export function CurrencySettings({ accessToken, disabled }: CurrencySettingsProps) {
  const { toast } = useToast();
  const [currencies, setCurrencies] = useState<CurrencyRow[]>([]);
  const [baseCurrency, setBaseCurrency] = useState<string>('');
  const [pendingBase, setPendingBase] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBase, setSavingBase] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ index: number; row: CurrencyRow } | null>(null);

  const fetchCurrencies = useCallback(async () => {
    try {
      setLoading(true);
      const data = await CurrencyService.listWithBase(accessToken);
      setCurrencies(data.currencies.map((c: Currency) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        symbol: c.symbol,
      })));
      setBaseCurrency(data.base_currency);
      setPendingBase(data.base_currency);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to fetch currencies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [accessToken, toast]);

  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

  const handleSaveBaseCurrency = useCallback(async () => {
    if (!pendingBase || pendingBase === baseCurrency) return;
    setSavingBase(true);
    try {
      await CurrencyService.setBaseCurrency(pendingBase, accessToken);
      setBaseCurrency(pendingBase);
      toast({ title: 'Base currency updated', description: `Base currency is now ${pendingBase}` });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update base currency',
        variant: 'destructive',
      });
      setPendingBase(baseCurrency); // revert
    } finally {
      setSavingBase(false);
    }
  }, [pendingBase, baseCurrency, accessToken, toast]);

  const handleDataChange = useCallback(async (newData: CurrencyRow[]) => {
    const newRows = newData.filter((r) => r.isNew && r.code && r.name && r.symbol);

    if (newRows.length === 0) {
      setCurrencies(newData);
      return;
    }

    setSaving(true);
    try {
      for (const row of newRows) {
        const payload: CreateCurrencyPayload = {
          code: row.code,
          name: row.name,
          symbol: row.symbol,
        };
        await CurrencyService.create(payload, accessToken);
      }
      toast({ title: 'Success', description: 'Currency added successfully' });
      await fetchCurrencies();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create currency',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [accessToken, fetchCurrencies, toast]);

  const handleDeleteRow = useCallback((index: number) => {
    const row = currencies[index];
    if (!row) return;

    if (row.isNew) {
      setCurrencies((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    setDeleteTarget({ index, row });
  }, [currencies]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const { row } = deleteTarget;

    setSaving(true);
    try {
      await CurrencyService.delete(row.id, accessToken);
      toast({ title: 'Success', description: `Currency ${row.code} deleted` });
      setDeleteTarget(null);
      await fetchCurrencies();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete currency',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [deleteTarget, accessToken, fetchCurrencies, toast]);

  const columns: ColumnDef<CurrencyRow, string>[] = useMemo(() => [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: disabled ? undefined : EditableCell,
      size: 120,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: disabled ? undefined : EditableCell,
      size: 200,
    },
    {
      accessorKey: 'symbol',
      header: 'Symbol',
      cell: disabled ? undefined : EditableCell,
      size: 100,
    },
    ...(!disabled ? [{
      id: 'actions',
      header: 'Action',
      cell: DeleteCell as ColumnDef<CurrencyRow, string>['cell'],
      size: 60,
    }] : []),
  ], [disabled]);

  const config = useMemo(() => ({
    showPagination: false,
    enableSorting: false,
    enableFiltering: false,
    meta: {
      deleteRow: handleDeleteRow,
    },
  }), [handleDeleteRow]);

  // Find the current base currency details for display
  const baseCurrencyDetails = currencies.find(c => c.code === baseCurrency);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Currencies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">Loading currencies...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Base Currency Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Base Currency
          </CardTitle>
          <CardDescription>
            The primary currency used across your organization for pricing, invoices, and reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Current base currency display */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border mb-4">
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Currently set to</p>
              <p className="text-sm font-semibold">
                {baseCurrencyDetails
                  ? `${baseCurrencyDetails.symbol} — ${baseCurrencyDetails.code} (${baseCurrencyDetails.name})`
                  : baseCurrency || 'Not configured'}
              </p>
            </div>
            <Badge variant="success" className="shrink-0">Active</Badge>
          </div>

          {/* Change base currency */}
          {!disabled && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Change base currency:</p>
              <div className="flex gap-2">
                <Select
                  value={pendingBase}
                  onValueChange={setPendingBase}
                  disabled={savingBase}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className="font-mono mr-2">{c.symbol}</span>
                        {c.code} — {c.name}
                        {c.code === baseCurrency && (
                          <span className="ml-2 text-xs text-muted-foreground">(current)</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleSaveBaseCurrency}
                  disabled={savingBase || pendingBase === baseCurrency || !pendingBase}
                  size="sm"
                >
                  {savingBase ? 'Saving...' : 'Save'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Changing the base currency affects how amounts are displayed across the app. Existing transactions are not converted.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Currencies Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Additional Currencies</CardTitle>
              <CardDescription>
                Manage currencies available for transactions in your organization.
              </CardDescription>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={() => setCurrencies(prev => [...prev, { ...EMPTY_ROW }])}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 shrink-0"
              >
                + Add Currency
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className={currencies.length > 10 ? 'max-h-[480px] overflow-y-auto pr-1' : undefined}>
            <EditableDataTable data={currencies}
            columns={columns}
            config={config}
            onDataChange={handleDataChange}
            enableAddRow={false}
            enableDeleteRow={false}
            newRowTemplate={EMPTY_ROW}
            addRowLabel="Add Currency"
            heading="" />
          </div>
          {saving && (
            <div className="text-muted-foreground text-sm mt-2">Saving...</div>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Currency"
        description={`Are you sure you want to delete ${deleteTarget?.row.code ?? ''} (${deleteTarget?.row.name ?? ''})? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={saving}
        onConfirm={handleConfirmDelete} />
    </div>
  );
}
