import * as React from 'react';

import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../../environments/environment';
import type { StockEntryFormState } from '../../types/stock.types';

const ENTRY_TYPE_OPTIONS = [
  { value: 'material_receipt', label: 'Material Receipt' },
  { value: 'material_issue', label: 'Material Issue' },
  { value: 'material_transfer', label: 'Material Transfer' },
  { value: 'manufacture', label: 'Manufacture' },
  { value: 'repack', label: 'Repack' },
] as const;

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

interface AssignedWarehouse {
  id: string;
  name: string;
  code: string;
}

function useAssignedWarehouses() {
  const accessToken = useUserStore((s) => s.accessToken);
  const [warehouses, setWarehouses] = React.useState<AssignedWarehouse[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!accessToken) { setWarehouses([]); setLoading(false); return; }
    setLoading(true);
    fetch(`${environment.apiCoreUrl}/api/v1/warehouse-users/my-warehouses`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => setWarehouses(data.warehouses ?? []))
      .catch(() => setWarehouses([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  return { warehouses, loading };
}

interface WarehouseSelectorProps {
  label: string;
  htmlId: string;
  value: string;
  onChange: (value: string) => void;
}

function WarehouseSelector({ label, htmlId, value, onChange }: WarehouseSelectorProps) {
  const { warehouses, loading } = useAssignedWarehouses();

  // Auto-select if only one warehouse is assigned and no value is set yet
  React.useEffect(() => {
    if (!loading && warehouses.length === 1 && !value) {
      onChange(warehouses[0].id);
    }
  }, [loading, warehouses, value, onChange]);

  return (
    <div className="space-y-2">
      <Label htmlFor={htmlId}>{label}</Label>
      <Select value={value || 'none'}
        onValueChange={(v) => onChange(v === 'none' ? '' : v)}>
        <SelectTrigger>
          <SelectValue placeholder="Select warehouse" />
        </SelectTrigger>
        <SelectContent>
          <div className="max-h-[200px] overflow-y-auto">
            <SelectItem value="none">None</SelectItem>
            {loading ? (
              <div className="p-2 text-xs text-muted-foreground text-center">Loading...</div>
            ) : (
              warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </SelectItem>
              ))
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}

interface WarehouseFieldsProps {
  form: StockEntryFormState;
  onFieldChange: (field: keyof StockEntryFormState, value: string) => void;
}

function WarehouseFields({ form, onFieldChange }: WarehouseFieldsProps) {
  const entryType = form.stock_entry_type;

  if (entryType === 'material_receipt') {
    return (
      <div className="grid grid-cols-2 gap-4">
        <WarehouseSelector label="To Warehouse (Destination)"
          htmlId="to_warehouse_id"
          value={form.to_warehouse_id}
          onChange={(v) => onFieldChange('to_warehouse_id', v)} />
      </div>
    );
  }

  if (entryType === 'material_issue') {
    return (
      <div className="grid grid-cols-2 gap-4">
        <WarehouseSelector label="From Warehouse (Source)"
          htmlId="from_warehouse_id"
          value={form.from_warehouse_id}
          onChange={(v) => onFieldChange('from_warehouse_id', v)} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <WarehouseSelector label="From Warehouse (Source)"
        htmlId="from_warehouse_id"
        value={form.from_warehouse_id}
        onChange={(v) => onFieldChange('from_warehouse_id', v)} />
      <WarehouseSelector label="To Warehouse (Destination)"
        htmlId="to_warehouse_id"
        value={form.to_warehouse_id}
        onChange={(v) => onFieldChange('to_warehouse_id', v)} />
    </div>
  );
}

interface StockEntryHeaderProps {
  form: StockEntryFormState;
  isEditing: boolean;
  onFieldChange: (field: keyof StockEntryFormState, value: string) => void;
  disabled?: boolean;
  fromWarehouseName?: string;
  toWarehouseName?: string;
}

export function StockEntryHeader({ form, isEditing, onFieldChange, disabled = false, fromWarehouseName, toWarehouseName }: StockEntryHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stock_entry_no">Entry No.</Label>
          <Input id="stock_entry_no"
            value={form.stock_entry_no}
            onChange={(e) => onFieldChange('stock_entry_no', e.target.value)}
            placeholder="Auto-generated"
            disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock_entry_type">Entry Type</Label>
          <Select value={form.stock_entry_type}
            onValueChange={(v) => onFieldChange('stock_entry_type', v)}
            disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {ENTRY_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={form.status}
            onValueChange={(v) => onFieldChange('status', v)}
            disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="posting_date">Posting Date</Label>
          <Input id="posting_date"
            type="date"
            value={form.posting_date}
            onChange={(e) => onFieldChange('posting_date', e.target.value)}
            required
            disabled={disabled} />
        </div>
      </div>
      {!disabled && <WarehouseFields form={form} onFieldChange={onFieldChange} />}
      {disabled && (
        <div className="grid grid-cols-2 gap-4">
          {fromWarehouseName && (
            <div className="space-y-2">
              <Label>From Warehouse</Label>
              <Input value={fromWarehouseName} disabled />
            </div>
          )}
          {toWarehouseName && (
            <div className="space-y-2">
              <Label>To Warehouse</Label>
              <Input value={toWarehouseName} disabled />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
