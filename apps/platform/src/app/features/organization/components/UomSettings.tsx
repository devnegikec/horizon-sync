import { useCallback, useEffect, useMemo, useState } from 'react';

import { type CellContext, type ColumnDef } from '@tanstack/react-table';
import { Trash2, Save } from 'lucide-react';

import { ConfirmationDialog, EditableCell, EditableDataTable } from '@horizon-sync/ui/components';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { UomService, type Uom, type CreateUomPayload } from '../../../services/uom.service';

interface UomSettingsProps {
  accessToken: string;
  disabled?: boolean;
}

interface UomRow {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  isNew?: boolean;
}

const EMPTY_ROW: UomRow = { id: '', name: '', abbreviation: '', description: '', isNew: true };

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

function SaveCell<TData extends UomRow>({ row, table }: CellContext<TData, unknown>) {
  const meta = table.options.meta as { saveRow?: (index: number) => void } | undefined;
  const data = row.original;
  if (!data.isNew || !meta?.saveRow) return null;

  const canSave = data.name.trim() !== '' && data.abbreviation.trim() !== '';

  return (
    <Button type="button"
      variant="ghost"
      size="sm"
      disabled={!canSave}
      title={canSave ? 'Save this unit' : 'Fill in name and abbreviation first'}
      onClick={() => meta.saveRow?.(row.index)}>
      <Save className="h-4 w-4 text-primary" />
    </Button>
  );
}

export function UomSettings({ accessToken, disabled }: UomSettingsProps) {
  const { toast } = useToast();
  const [uoms, setUoms] = useState<UomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ index: number; row: UomRow } | null>(null);

  const fetchUoms = useCallback(async () => {
    try {
      setLoading(true);
      const data = await UomService.list(accessToken);
      setUoms(data.map((u: Uom) => ({
        id: u.id,
        name: u.name,
        abbreviation: u.abbreviation,
        description: u.description,
      })));
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to fetch units of measure',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [accessToken, toast]);

  useEffect(() => {
    fetchUoms();
  }, [fetchUoms]);

  // Only track local edits — never auto-save
  const handleDataChange = useCallback((newData: UomRow[]) => {
    setUoms(newData);
  }, []);

  // Explicit save for a single new row
  const handleSaveRow = useCallback(async (index: number) => {
    const row = uoms[index];
    if (!row || !row.isNew) return;

    if (!row.name.trim() || !row.abbreviation.trim()) {
      toast({
        title: 'Validation',
        description: 'Name and abbreviation are required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const payload: CreateUomPayload = {
        name: row.name.trim(),
        abbreviation: row.abbreviation.trim(),
        description: row.description.trim(),
      };
      await UomService.create(payload, accessToken);
      toast({ title: 'Success', description: `Unit "${payload.name}" added successfully` });
      await fetchUoms();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create unit of measure',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [uoms, accessToken, fetchUoms, toast]);

  const handleDeleteRow = useCallback((index: number) => {
    const row = uoms[index];
    if (!row) return;

    if (row.isNew) {
      setUoms((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    setDeleteTarget({ index, row });
  }, [uoms]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const { row } = deleteTarget;

    setSaving(true);
    try {
      await UomService.delete(row.id, accessToken);
      toast({ title: 'Success', description: `Unit "${row.name}" deleted` });
      setDeleteTarget(null);
      await fetchUoms();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete unit of measure',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [deleteTarget, accessToken, fetchUoms, toast]);

  const columns: ColumnDef<UomRow, string>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Name *',
      cell: disabled ? undefined : EditableCell,
      size: 180,
    },
    {
      accessorKey: 'abbreviation',
      header: 'Abbreviation *',
      cell: disabled ? undefined : EditableCell,
      size: 120,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: disabled ? undefined : EditableCell,
      size: 250,
    },
    ...(!disabled ? [
      {
        id: 'save',
        header: '',
        cell: SaveCell as ColumnDef<UomRow, string>['cell'],
        size: 50,
      },
      {
        id: 'actions',
        header: '',
        cell: DeleteCell as ColumnDef<UomRow, string>['cell'],
        size: 50,
      },
    ] : []),
  ], [disabled]);

  const config = useMemo(() => ({
    showPagination: false,
    enableSorting: false,
    enableFiltering: false,
    meta: {
      deleteRow: handleDeleteRow,
      saveRow: handleSaveRow,
    },
  }), [handleDeleteRow, handleSaveRow]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Units of Measure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">Loading units of measure...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Units of Measure</CardTitle>
        <CardDescription>
          Manage units of measure for your organization. Click the save icon to confirm a new unit after filling in the fields.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EditableDataTable data={uoms}
          columns={columns}
          config={config}
          onDataChange={handleDataChange}
          enableAddRow={!disabled}
          enableDeleteRow={false}
          newRowTemplate={EMPTY_ROW}
          addRowLabel="Add Unit"
          heading="" />
        {saving && (
          <div className="text-muted-foreground text-sm mt-2">Saving...</div>
        )}
      </CardContent>
      <ConfirmationDialog open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Unit of Measure"
        description={`Are you sure you want to delete "${deleteTarget?.row.name ?? ''}" (${deleteTarget?.row.abbreviation ?? ''})? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={saving}
        onConfirm={handleConfirmDelete} />
    </Card>
  );
}
