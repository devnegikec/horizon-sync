import * as React from 'react';

import { Loader2, Warehouse as WarehouseIcon } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import { useWarehouseMutations } from '../../hooks/useWarehouses';
import type { Warehouse, CreateWarehousePayload, WarehouseType } from '../../types/warehouse.types';

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

export function WarehouseDialog({
  open,
  onOpenChange,
  warehouse,
  warehouses,
  onCreated,
  onUpdated,
}: WarehouseDialogProps) {
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

  const isEditing = !!warehouse;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const payload: CreateWarehousePayload = {
      name: formData.name,
      code: formData.code,
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

  const availableParentWarehouses = warehouses.filter(
    (w) => w.id !== warehouse?.id && w.warehouse_type === 'warehouse'
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <WarehouseIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{isEditing ? 'Edit Warehouse' : 'Create New Warehouse'}</DialogTitle>
              <DialogDescription>
                {isEditing
                  ? 'Update the warehouse details below'
                  : 'Add a new warehouse or storage location'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Warehouse Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., WH-MAIN"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouse_type">Type</Label>
                <Select
                  value={formData.warehouse_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, warehouse_type: value as WarehouseType })
                  }
                >
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
              <Label htmlFor="name">Warehouse Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter warehouse name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter warehouse description"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent_warehouse_id">Parent Warehouse</Label>
              <Select
                value={formData.parent_warehouse_id || 'none'}
                onValueChange={(value) =>
                  setFormData({ ...formData, parent_warehouse_id: value === 'none' ? '' : value })
                }
              >
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
                  <Input
                    id="address_line1"
                    value={formData.address_line1}
                    onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                    placeholder="Street address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_line2">Address Line 2</Label>
                  <Input
                    id="address_line2"
                    value={formData.address_line2}
                    onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                    placeholder="Apt, suite, unit, etc."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="State"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      placeholder="Postal code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="Country"
                    />
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
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="Contact person name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Phone</Label>
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder="Email address"
                    />
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
                  <Input
                    id="total_capacity"
                    type="number"
                    value={formData.total_capacity}
                    onChange={(e) => setFormData({ ...formData, total_capacity: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity_uom">Unit of Measure</Label>
                  <Input
                    id="capacity_uom"
                    value={formData.capacity_uom}
                    onChange={(e) => setFormData({ ...formData, capacity_uom: e.target.value })}
                    placeholder="e.g., sqft, pallets"
                  />
                </div>
              </div>
            </div>
          </div>

          {submitError && <p className="text-sm text-destructive mb-4">{submitError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
