import * as React from 'react';

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Label, Separator, Textarea } from '@horizon-sync/ui/components';

import type { CreateRFQPayload, RFQ, UpdateRFQPayload } from '../../types/rfq.types';

interface RFQDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rfq: RFQ | null;
  onSave: (data: CreateRFQPayload | UpdateRFQPayload, id?: string) => Promise<void>;
  saving: boolean;
}

export function RFQDialog({ open, onOpenChange, rfq, onSave, saving }: RFQDialogProps) {
  const isEdit = !!rfq;

  const [formData, setFormData] = React.useState({
    material_request_id: '',
    supplier_ids: '',
    closing_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 14 days from now
  });

  React.useEffect(() => {
    if (rfq) {
      setFormData({
        material_request_id: rfq.material_request_id || '',
        supplier_ids: rfq.suppliers?.map(s => s.supplier_id).join(', ') || '',
        closing_date: rfq.closing_date.slice(0, 10),
      });
    } else {
      setFormData({
        material_request_id: '',
        supplier_ids: '',
        closing_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      });
    }
  }, [rfq, open]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!isEdit && !formData.material_request_id) {
      alert('Please enter a material request ID');
      return;
    }
    if (!formData.supplier_ids.trim()) {
      alert('Please enter at least one supplier ID');
      return;
    }
    if (!formData.closing_date) {
      alert('Please select a closing date');
      return;
    }
    if (new Date(formData.closing_date) < new Date()) {
      alert('Closing date must be in the future');
      return;
    }

    const supplierIds = formData.supplier_ids
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);

    if (supplierIds.length === 0) {
      alert('Please enter valid supplier IDs');
      return;
    }

    if (isEdit) {
      const updateData: UpdateRFQPayload = {
        closing_date: new Date(formData.closing_date).toISOString(),
        supplier_ids: supplierIds,
      };
      await onSave(updateData, rfq.id);
    } else {
      const createData: CreateRFQPayload = {
        material_request_id: formData.material_request_id,
        closing_date: new Date(formData.closing_date).toISOString(),
        supplier_ids: supplierIds,
      };
      await onSave(createData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit RFQ' : 'Create RFQ'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="material_request_id">Material Request ID *</Label>
              <Input 
                id="material_request_id"
                value={formData.material_request_id}
                onChange={(e) => handleChange('material_request_id', e.target.value)}
                disabled={isEdit}
                placeholder="Enter material request ID"
                required
              />
              <p className="text-xs text-muted-foreground">
                The material request this RFQ is based on
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier_ids">Supplier IDs *</Label>
              <Textarea 
                id="supplier_ids"
                value={formData.supplier_ids}
                onChange={(e) => handleChange('supplier_ids', e.target.value)}
                placeholder="supplier-id-1, supplier-id-2, supplier-id-3"
                rows={3}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter supplier IDs separated by commas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="closing_date">Closing Date *</Label>
              <Input 
                id="closing_date"
                type="date"
                value={formData.closing_date}
                onChange={(e) => handleChange('closing_date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              <p className="text-xs text-muted-foreground">
                Last date for suppliers to submit quotes
              </p>
            </div>
          </div>

          <Separator />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update RFQ' : 'Create RFQ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
