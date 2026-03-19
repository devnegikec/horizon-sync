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
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

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
  } = useForm<CreateQSealProductPayload>({
    defaultValues: {
      product_code: '',
      product_name: '',
      description: '',
      category: '',
      qr_type: 'dynamic',
    },
  });

  const qrType = watch('qr_type');

  // Populate form when editing
  React.useEffect(() => {
    if (open) {
      if (product) {
        reset({
          product_code: product.product_code,
          product_name: product.product_name,
          description: product.description ?? '',
          category: product.category ?? '',
          qr_type: product.qr_type,
        });
      } else {
        reset({
          product_code: '',
          product_name: '',
          description: '',
          category: '',
          qr_type: 'dynamic',
        });
      }
    }
  }, [open, product, reset]);

  const onSubmit = async (data: CreateQSealProductPayload) => {
    onSave({
      ...data,
      description: data.description || null,
      category: data.category || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit QSeal Product' : 'New QSeal Product'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_code">Product Code *</Label>
              <Input
                id="product_code"
                placeholder="QSP-001"
                {...register('product_code', { required: 'Product code is required' })}
              />
              {errors.product_code && (
                <p className="text-xs text-destructive">{errors.product_code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g. Beverages"
                {...register('category')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_name">Product Name *</Label>
            <Input
              id="product_name"
              placeholder="Enter product name"
              {...register('product_name', { required: 'Product name is required' })}
            />
            {errors.product_name && (
              <p className="text-xs text-destructive">{errors.product_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>QR Type *</Label>
            <Select
              value={qrType}
              onValueChange={(v) => setValue('qr_type', v as QSealQRType)}
            >
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

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional product description"
              rows={3}
              {...register('description')}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
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
