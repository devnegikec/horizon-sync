import * as React from 'react';

import { Loader2, Warehouse as WarehouseIcon } from 'lucide-react';

import { DetailDialog } from '@horizon-sync/ui/components';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';
import { cn } from '@horizon-sync/ui/lib';

import { useWarehouseMutations } from '../../hooks/useWarehouses';
import type { Warehouse, CreateWarehousePayload, WarehouseType } from '../../types/warehouse.types';
import { warehouseFormSchema, isAtMaxLength } from '../../utility/validation-schemas';
import { UOMSelect } from '../shared/UOMSelect';

interface WarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse?: Warehouse | null;
  warehouses: Warehouse[];
  onCreated?: () => void;
  onUpdated?: () => void;
}

const warehouseTypeOptions: { value: WarehouseType; label: string }[] = [
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'store', label: 'Store' },
  { value: 'transit', label: 'Transit' },
];

// eslint-disable-next-line complexity
export function WarehouseDialog({ open, onOpenChange, warehouse, warehouses, onCreated, onUpdated }: WarehouseDialogProps) {
  const { createWarehouse, updateWarehouse, loading } = useWarehouseMutations();
  const [formData, setFormData] = React.useState({
    name: '',
    code: '',
    description: '',
    warehouse_type: 'warehouse' as WarehouseType,
    parent_warehouse_id: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    total_capacity: '',
    capacity_uom: '',
    is_active: true,
    is_default: false,
  });
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const isEditing = !!warehouse;

  // eslint-disable-next-line complexity
  React.useEffect(() => {
    if (warehouse) {
      setFormData({
        name: warehouse.name,
        code: warehouse.code,
        description: warehouse.description || '',
        warehouse_type: warehouse.warehouse_type,
        parent_warehouse_id: warehouse.parent_warehouse_id || '',
        address_line1: warehouse.address_line1 || '',
        address_line2: warehouse.address_line2 || '',
        city: warehouse.city || '',
        state: warehouse.state || '',
        postal_code: warehouse.postal_code || '',
        country: warehouse.country || '',
        contact_name: warehouse.contact_name || '',
        contact_phone: warehouse.contact_phone || '',
        contact_email: warehouse.contact_email || '',
        total_capacity: warehouse.total_capacity?.toString() || '',
        capacity_uom: warehouse.capacity_uom || '',
        is_active: warehouse.is_active,
        is_default: warehouse.is_default,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        warehouse_type: 'warehouse',
        parent_warehouse_id: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        contact_name: '',
        contact_phone: '',
        contact_email: '',
        total_capacity: '',
        capacity_uom: '',
        is_active: true,
        is_default: false,
      });
    }
    setSubmitError(null);
  }, [warehouse, open]);

  // eslint-disable-next-line complexity
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    // Validate with Zod schema
    const validationData = {
      ...formData,
      total_capacity: formData.total_capacity ? parseInt(formData.total_capacity, 10) : undefined,
      is_active: formData.is_active,
      is_default: formData.is_default,
    };

    const result = warehouseFormSchema.safeParse(validationData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!errors[path]) errors[path] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    const payload: CreateWarehousePayload = {
      name: formData.name,
      code: isEditing ? formData.code : undefined,
      description: formData.description || undefined,
      warehouse_type: formData.warehouse_type,
      parent_warehouse_id: formData.parent_warehouse_id || undefined,
      address_line1: formData.address_line1 || undefined,
      address_line2: formData.address_line2 || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      postal_code: formData.postal_code || undefined,
      country: formData.country || undefined,
      contact_name: formData.contact_name || undefined,
      contact_phone: formData.contact_phone || undefined,
      contact_email: formData.contact_email || undefined,
      total_capacity: formData.total_capacity ? parseInt(formData.total_capacity, 10) : undefined,
      capacity_uom: formData.capacity_uom || undefined,
      is_active: formData.is_active,
      is_default: formData.is_default,
    };

    try {
      if (isEditing && warehouse) {
        await updateWarehouse(warehouse.id, payload);
        onUpdated?.();
      } else {
        await createWarehouse(payload);
        onCreated?.();
      }
      onOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save warehouse');
    }
  };

  const availableParentWarehouses = warehouses.filter((w) => w.id !== warehouse?.id && w.warehouse_type === 'warehouse');

  return (
    <DetailDialog open={open}
      onOpenChange={onOpenChange}
      size="lg"
      contentClassName="max-w-4xl flex flex-col"
      style={{ height: 'min(85vh, 820px)' }}
      showCloseButton={false}
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <WarehouseIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{isEditing ? 'Edit Warehouse' : 'Create New Warehouse'}</p>
            <p className="text-xs text-muted-foreground font-normal">
              {isEditing ? 'Update the warehouse details below' : 'Add a new warehouse or storage location'}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="warehouse-form" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? 'Saving...' : 'Creating...'}
              </>
            ) : isEditing ? (
              'Save Changes'
            ) : (
              'Create Warehouse'
            )}
          </Button>
        </div>
      }>
      <form id="warehouse-form" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-4 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Warehouse Code</Label>
              <Input id="code"
                value={isEditing ? formData.code : ''}
                placeholder="Auto-generated"
                disabled
                className="bg-muted/50 cursor-not-allowed" />
              <p className="text-xs text-muted-foreground">{isEditing ? 'Code cannot be changed' : 'Will be auto-generated on save'}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="warehouse_type">Type</Label>
              <Select value={formData.warehouse_type} onValueChange={(value) => setFormData({ ...formData, warehouse_type: value as WarehouseType })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {warehouseTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Warehouse Name <span className="text-red-500">*</span>
            </Label>
            <Input id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter warehouse name"
              className={cn((fieldErrors['name'] || formData.name.length > 255) && 'border-red-500')}
              required />
            {fieldErrors['name'] && <p className="text-xs text-red-500">{fieldErrors['name']}</p>}
            {formData.name.length > 255 && <p className="text-xs text-red-500">Cannot exceed 255 characters</p>}
            <p className={cn('text-xs text-right', isAtMaxLength(formData.name, 255) ? 'text-red-500 font-medium' : 'text-muted-foreground')}>
              {formData.name.length}/255
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter warehouse description"
              className={cn((fieldErrors['description'] || formData.description.length > 1000) && 'border-red-500')}
              rows={2} />
            {fieldErrors['description'] && <p className="text-xs text-red-500">{fieldErrors['description']}</p>}
            {formData.description.length > 1000 && <p className="text-xs text-red-500">Cannot exceed 1000 characters</p>}
            <p className={cn('text-xs text-right', isAtMaxLength(formData.description, 1000) ? 'text-red-500 font-medium' : 'text-muted-foreground')}>
              {formData.description.length}/1000
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent_warehouse_id">Parent Warehouse</Label>
            <Select value={formData.parent_warehouse_id || 'none'}
              onValueChange={(value) => setFormData({ ...formData, parent_warehouse_id: value === 'none' ? '' : value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select parent warehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {availableParentWarehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Address Info */}
          <div className="border-t pt-4 mt-2">
            <h4 className="text-sm font-medium mb-3">Address Information</h4>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="address_line1">Address Line 1</Label>
                <Input id="address_line1"
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  placeholder="Street address" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_line2">Address Line 2</Label>
                <Input id="address_line2"
                  value={formData.address_line2}
                  onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                  placeholder="Apt, suite, unit, etc." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="City" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="Postal code" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Country" />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="border-t pt-4 mt-2">
            <h4 className="text-sm font-medium mb-3">Contact Information</h4>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Name</Label>
                <Input id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  placeholder="Contact person name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Phone</Label>
                  <Input id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="Phone number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email</Label>
                  <Input id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="Email address" />
                </div>
              </div>
            </div>
          </div>

          {/* Capacity Info */}
          <div className="border-t pt-4 mt-2">
            <h4 className="text-sm font-medium mb-3">Capacity</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_capacity">Total Capacity</Label>
                <Input id="total_capacity"
                  type="number"
                  value={formData.total_capacity}
                  readOnly
                  className="bg-muted/50 cursor-not-allowed"
                  placeholder="Auto-calculated" />
                <p className="text-xs text-muted-foreground">
                  Derived from the warehouse layout — not editable here.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity_uom">Unit of Measure</Label>
                <UOMSelect value={formData.capacity_uom}
                  onValueChange={(v) => setFormData({ ...formData, capacity_uom: v })}
                  placeholder="Select volume/area UOM"
                  uomTypes={['volume', 'area']} />
              </div>
            </div>
          </div>
        </div>

        {submitError && <p className="text-sm text-destructive mb-4">{submitError}</p>}
      </form>
    </DetailDialog>
  );
}
