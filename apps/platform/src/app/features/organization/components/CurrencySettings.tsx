import { useCallback, useEffect, useMemo, useState } from 'react';

import { type CellContext, type ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';

import { EditableCell, EditableDataTable } from '@horizon-sync/ui/components';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
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
  const isNew = (row.original as CurrencyRow).isNew;
  if (!meta?.deleteRow && !isNew) return null;
  return (
    <Button type="button"
variant="ghost"
size="sm"
      onClick={() => meta?.deleteRow?.(row.index)}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}

export function CurrencySettings({ accessToken, disabled }: CurrencySettingsProps) {
  const { toast } = useToast();
  const [currencies, setCurrencies] = useState<CurrencyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCurrencies = useCallback(async () => {
    try {
      setLoading(true);
      const data = await CurrencyService.list(accessToken);
      setCurrencies(data.map((c: Currency) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        symbol: c.symbol,
      })));
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

  const handleDataChange = useCallback(async (newData: CurrencyRow[]) => {
    // Find newly completed rows (have all fields filled and are marked isNew)
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

  const handleDeleteRow = useCallback(async (index: number) => {
    const row = currencies[index];
    if (!row) return;

    if (row.isNew) {
      setCurrencies((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    setSaving(true);
    try {
      await CurrencyService.delete(row.id, accessToken);
      toast({ title: 'Success', description: `Currency ${row.code} deleted` });
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
  }, [currencies, accessToken, fetchCurrencies, toast]);

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
      header: '',
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
    <Card>
      <CardHeader>
        <CardTitle>Currencies</CardTitle>
        <CardDescription>
          Manage currencies for your organization. Add or remove currencies as needed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EditableDataTable data={currencies}
          columns={columns}
          config={config}
          onDataChange={handleDataChange}
          enableAddRow={!disabled}
          enableDeleteRow={!disabled}
          newRowTemplate={EMPTY_ROW}
          addRowLabel="Add Currency"
          heading=""/>
        {saving && (
          <div className="text-muted-foreground text-sm mt-2">Saving...</div>
        )}
      </CardContent>
    </Card>
  );
}
