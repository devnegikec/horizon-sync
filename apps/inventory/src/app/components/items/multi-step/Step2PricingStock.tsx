import * as React from 'react';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Checkbox } from '@horizon-sync/ui/components/ui/checkbox';
import { VALUATION_METHOD_OPTIONS } from '../../../constants/item-type-constants';
import type { ItemFormData } from '../../../utility/item-payload-builders';

interface Step2PricingStockProps {
  formData: ItemFormData;
  onUpdate: (data: Partial<ItemFormData>) => void;
}

export function Step2PricingStock({ formData, onUpdate }: Step2PricingStockProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Pricing & Stock</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Configure pricing and inventory settings
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold border-b pb-2">Pricing</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="standardRate">
              Standard Rate <span className="text-red-500">*</span>
            </Label>
            <Input
              id="standardRate"
              type="number"
              step="0.01"
              min="0"
              value={formData.defaultPrice}
              onChange={(e) => onUpdate({ defaultPrice: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valuationRate">Valuation Rate</Label>
            <Input
              id="valuationRate"
              type="number"
              step="0.01"
              min="0"
              value={formData.valuationRate}
              onChange={(e) => onUpdate({ valuationRate: e.target.value })}
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minOrderQty">
              Minimum Order Quantity <span className="text-red-500">*</span>
            </Label>
            <Input
              id="minOrderQty"
              type="number"
              step="0.01"
              min="0"
              value={formData.minOrderQty}
              onChange={(e) => onUpdate({ minOrderQty: Number(e.target.value) })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxOrderQty">Maximum Order Quantity</Label>
            <Input
              id="maxOrderQty"
              type="number"
              step="0.01"
              min="0"
              value={formData.maxOrderQty}
              onChange={(e) => onUpdate({ maxOrderQty: Number(e.target.value) })}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold border-b pb-2">Stock Settings</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="maintainStock"
              checked={formData.maintainStock}
              onCheckedChange={(checked) =>
                onUpdate({ maintainStock: checked === true })
              }
            />
            <Label htmlFor="maintainStock" className="cursor-pointer">
              Maintain Stock
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowNegativeStock"
              checked={formData.allowNegativeStock}
              onCheckedChange={(checked) =>
                onUpdate({ allowNegativeStock: checked === true })
              }
            />
            <Label htmlFor="allowNegativeStock" className="cursor-pointer">
              Allow Negative Stock
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Valuation Method</Label>
          <Select
            value={formData.valuationMethod}
            onValueChange={(value) => onUpdate({ valuationMethod: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              {VALUATION_METHOD_OPTIONS.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold border-b pb-2">Additional Details</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode</Label>
            <Input
              id="barcode"
              value={formData.barcode}
              onChange={(e) => onUpdate({ barcode: e.target.value })}
              placeholder="Enter barcode"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => onUpdate({ imageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
