import * as React from 'react';

import { useForm } from 'react-hook-form';

import { Button } from '@horizon-sync/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
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

import type { CreateQSealProductPayload, QSealProduct, QSealQRType } from '../../types/qseal.types';

interface QSealProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: QSealProduct | null;
  onSave: (data: CreateQSealProductPayload) => void;
}

const QR_TYPE_OPTIONS: { value: QSealQRType; label: string; description: string }[] = [
  { value: 'dynamic', label: 'Dynamic', description: 'QR content can be updated after generation' },
  { value: 'secure_qr_runtime', label: 'Secure QR Runtime', description: 'Cryptographically secured, runtime-verified QR' },
  { value: 'static_qr', label: 'Static QR', description: 'Fixed content, ideal for product info pages' },
];

interface FormValues {
  name: string;
  generic_name: string;
  gtin: string;
  industry: string;
  qr_type: string;
}

export function QSealProductDialog({
  open,
  onOpenChange,
  product,
  onSave,
}: QSealProductDialogProps) {
  const isEdit = !!product;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      generic_name: '',
      gtin: '',
      industry: '',
      qr_type: 'dynamic',
    },
  });

  const qrType = watch('qr_type');

  // Populate form when editing
  React.useEffect(() => {
    if (open) {
      if (product) {
        reset({
          name: product.name,
          generic_name: product.generic_name ?? '',
          gtin: product.gtin ?? '',
          industry: product.industry ?? '',
          qr_type: product.qr_type ?? 'dynamic',
        });
      } else {
        reset({
          name: '',
          generic_name: '',
          gtin: '',
          industry: '',
          qr_type: 'dynamic',
        });
      }
    }
  }, [open, product, reset]);

  const onSubmit = async (data: FormValues) => {
    onSave({
      name: data.name,
      generic_name: data.generic_name || null,
      gtin: data.gtin || null,
      industry: data.industry || null,
      qr_type: data.qr_type || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit QSeal Product' : 'New QSeal Product'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input id="name" placeholder="Enter product name" {...register('name', { required: 'Product name is required' })} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gtin">GTIN</Label>
              <Input id="gtin" placeholder="e.g. 0123456789012" {...register('gtin')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" placeholder="e.g. Pharmaceuticals" {...register('industry')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="generic_name">Generic Name</Label>
            <Input id="generic_name" placeholder="Optional generic/alternate name" {...register('generic_name')} />
          </div>

          <div className="space-y-2">
            <Label>QR Type *</Label>
            <Select value={qrType} onValueChange={(v) => setValue('qr_type', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QR_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div>
                      <p className="font-medium">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
