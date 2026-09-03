import * as React from 'react';

import { Check, ChevronsUpDown, Loader2, Plus, RefreshCw, Search, Zap, QrCode } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DetailDialog } from '@horizon-sync/ui/components';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@horizon-sync/ui/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@horizon-sync/ui/components/ui/table';
import { cn } from '@horizon-sync/ui/lib/utils';

import { useBatches } from '../../hooks/useBatches';
import { useCreateBatch } from '../../hooks/useCreateBatch';
import { notificationService } from '../../services/notificationService';
import type { BatchListItem, BatchStatus } from '../../types/batch.types';
import { apiRequest } from '../../utility/api/core';

interface ItemPickerItem {
  id: string;
  item_code: string;
  item_name: string;
  uom: string | null;
  standard_rate: string | null;
}

interface ItemPickerResponse {
  items: ItemPickerItem[];
}

interface BatchFormState {
  item_id: string;
  batch_no: string;
  manufacturing_date: string;
  expiry_date: string;
  supplier_batch_no: string;
  status: BatchStatus;
  description: string;
}

const EMPTY_FORM: BatchFormState = {
  item_id: '',
  batch_no: '',
  manufacturing_date: '',
  expiry_date: '',
  supplier_batch_no: '',
  status: 'active',
  description: '',
};

const STATUS_CONFIG: Record<BatchStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' }> = {
  active: { label: 'Active', variant: 'success' },
  expired: { label: 'Expired', variant: 'warning' },
  consumed: { label: 'Consumed', variant: 'secondary' },
};

/** True when an expiry date is in the past (date-only comparison). */
function isExpiredDate(value: string | null): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

/** Derive the effective status, treating an active batch with a past expiry as expired. */
function getEffectiveStatus(batch: BatchListItem): BatchStatus {
  if (batch.status === 'expired' || isExpiredDate(batch.expiry_date)) return 'expired';
  return batch.status ?? 'active';
}

interface ItemSelectProps {
  value: string;
  onChange: (item: ItemPickerItem) => void;
}

function ItemSelect({ value, onChange }: ItemSelectProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [items, setItems] = React.useState<ItemPickerItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedName, setSelectedName] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchItems = React.useCallback(
    async (q: string) => {
      if (!accessToken) return;
      setLoading(true);
      try {
        const res = await apiRequest<ItemPickerResponse>('/items/picker', accessToken, {
          params: { search: q || undefined },
        });
        setItems(res.items ?? []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  React.useEffect(() => {
    if (!open) {
      setSearch('');
      return;
    }
    fetchItems('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open, fetchItems]);

  const handleSearch = (q: string) => {
    setSearch(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchItems(q), 300);
  };

  const handleSelect = (item: ItemPickerItem) => {
    onChange(item);
    setSelectedName(`${item.item_name} (${item.item_code})`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls="item-listbox"
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
          <span className={cn('truncate', !value && 'text-muted-foreground')}>{value ? selectedName || 'Item selected' : 'Search items…'}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[340px]">
        <div className="flex items-center border-b px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input ref={inputRef}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or code…"
            className="h-7 border-0 p-0 shadow-none focus-visible:ring-0" />
        </div>
        <div id="item-listbox" className="max-h-60 overflow-y-auto p-1">
          {loading && (
            <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading…
            </div>
          )}
          {!loading && items.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No items found.</p>}
          {!loading &&
            items.map((item) => (
              <button key={item.id}
                type="button"
                className={cn(
                  'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                  value === item.id && 'bg-accent text-accent-foreground',
                )}
                onClick={() => handleSelect(item)}>
                <Check className={cn('mr-2 h-4 w-4 shrink-0', value === item.id ? 'opacity-100' : 'opacity-0')} />
                <div className="text-left">
                  <p className="font-medium">{item.item_name}</p>
                  {item.item_code && <p className="text-xs text-muted-foreground font-mono">{item.item_code}</p>}
                </div>
              </button>
            ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}


export function ActivationManagement() {
  const { batches, loading, error: listError, refetch } = useBatches();
  const { createBatch, loading: creating } = useCreateBatch();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<BatchFormState>(EMPTY_FORM);
  const [formError, setFormError] = React.useState<string | null>(null);

  const openDialog = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  };

  const updateField = <K extends keyof BatchFormState>(field: K, value: BatchFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Maps backend conflict (duplicate batch_no) to a friendly form error.
  // eslint-disable-next-line complexity
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.item_id) {
      setFormError('Please select an item');
      return;
    }
    if (!form.batch_no.trim()) {
      setFormError('Batch number is required');
      return;
    }

    try {
      const created = await createBatch({
        batch_no: form.batch_no.trim(),
        item_id: form.item_id,
        manufacturing_date: form.manufacturing_date ? `${form.manufacturing_date}T00:00:00Z` : null,
        expiry_date: form.expiry_date ? `${form.expiry_date}T00:00:00Z` : null,
        supplier_batch_no: form.supplier_batch_no.trim() || null,
        status: form.status,
        description: form.description.trim() || null,
      });
      notificationService.success(`Batch "${created.batch_no}" created`);
      setForm(EMPTY_FORM);
      setDialogOpen(false);
      refetch();
    } catch (err) {
      const code = (err as { details?: { detail?: { code?: string } } }).details?.detail?.code;
      if (code === 'DUPLICATE_BATCH_NO') {
        setFormError('This batch number already exists for this item');
      } else {
        setFormError((err as { message?: string }).message || 'Failed to create batch');
      }
    }
  };

  const stats = React.useMemo(
    () => ({
      total: batches.length,
      active: batches.filter((b) => getEffectiveStatus(b) === 'active').length,
      expired: batches.filter((b) => getEffectiveStatus(b) === 'expired').length,
      consumed: batches.filter((b) => getEffectiveStatus(b) === 'consumed').length,
    }),
    [batches],
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Batches</h2>
          <p className="text-muted-foreground">Manage manufacturing and production lots</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={openDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Batch
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {(
          [
            { label: 'Total Batches', value: stats.total },
            { label: 'Active', value: stats.active },
            { label: 'Expired', value: stats.expired },
            { label: 'Consumed', value: stats.consumed },
          ] as const
        ).map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {listError && <p className="text-sm text-destructive">{listError}</p>}

      {!loading && batches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No batches</p>
            <p className="text-muted-foreground mb-4">Create a batch to track a manufacturing lot</p>
            <Button size="sm" onClick={openDialog}>
              <Plus className="h-4 w-4 mr-2" />
              New Batch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch No</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                      Loading…
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  batches.map((batch) => {
                    const cfg = STATUS_CONFIG[getEffectiveStatus(batch)];
                    return (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">{batch.batch_no}</TableCell>
                        <TableCell>{batch.product_name || batch.item_name || (batch.item_id ? batch.item_id.slice(0, 8) : '—')}</TableCell>
                        <TableCell>{batch.expiry_date ? batch.expiry_date.slice(0, 10) : '—'}</TableCell>
                        <TableCell>{batch.created_at ? new Date(batch.created_at).toLocaleDateString() : '—'}</TableCell>
                        <TableCell>
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <DetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        size="lg"
        contentClassName="max-w-4xl flex flex-col"
        style={{ height: 'min(85vh, 820px)' }}
        title={
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <QrCode className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">'New Batch'</p>
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground font-mono font-normal">'Create a manufacturing batch tied to an item'</p>
                </div>
              </div>
            </div>
          </div>
        }
        showCloseButton={false}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" form="create-batch-form" disabled={creating || !form.item_id || !form.batch_no.trim()}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating…
                </>
              ) : (
                'Create Batch'
              )}
            </Button>
          </div>
        }>
        <form id="create-batch-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Item *</Label>
            <ItemSelect value={form.item_id} onChange={(item) => updateField('item_id', item.id)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="batch_no">Batch No *</Label>
            <Input id="batch_no"
              value={form.batch_no}
              onChange={(e) => updateField('batch_no', e.target.value)}
              maxLength={100}
              placeholder="e.g. LOT-2026-00042" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="manufacturing_date">Mfg. Date</Label>
              <Input id="manufacturing_date"
                type="date"
                value={form.manufacturing_date}
                onChange={(e) => updateField('manufacturing_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input id="expiry_date" type="date" value={form.expiry_date} onChange={(e) => updateField('expiry_date', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="supplier_batch_no">Supplier Batch No</Label>
            <Input id="supplier_batch_no"
              value={form.supplier_batch_no}
              onChange={(e) => updateField('supplier_batch_no', e.target.value)}
              maxLength={100}
              placeholder="Optional" />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(value) => updateField('status', value as BatchStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="consumed">Consumed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Optional" />
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
        </form>
      </DetailDialog >
    </div >
  );
}
