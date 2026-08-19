import * as React from 'react';

import { Checkbox } from '@horizon-sync/ui/components/ui/checkbox';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';

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
            <Input id="standardRate"
              type="number"
              step="0.01"
              min="0"
              value={formData.defaultPrice}
              onChange={(e) => onUpdate({ defaultPrice: e.target.value })}
              placeholder="0.00"
              required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valuationRate">Valuation Rate</Label>
            <Input id="valuationRate"
              type="number"
              step="0.01"
              min="0"
              value={formData.valuationRate}
              onChange={(e) => onUpdate({ valuationRate: e.target.value })}
              placeholder="0.00" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minOrderQty">
              Minimum Order Quantity <span className="text-red-500">*</span>
            </Label>
            <Input id="minOrderQty"
              type="number"
              step="1"
              min="1"
              value={formData.minOrderQty}
              onChange={(e) => onUpdate({ minOrderQty: Number(e.target.value) || 1 })}
              placeholder="1"
              required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxOrderQty">Maximum Order Quantity</Label>
            <Input id="maxOrderQty"
              type="number"
              step="1"
              min="0"
              value={formData.maxOrderQty || ''}
              onChange={(e) => onUpdate({ maxOrderQty: Number(e.target.value) || 0 })}
              placeholder="0 (unlimited)" />
            {formData.maxOrderQty > 0 && formData.minOrderQty > formData.maxOrderQty && (
              <p className="text-xs text-red-500">
                Maximum order quantity must be ≥ minimum order quantity
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold border-b pb-2">Stock Settings</h4>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="maintainStock"
              checked={formData.maintainStock}
              onCheckedChange={(checked) =>
                onUpdate({ maintainStock: checked === true })
              } />
            <Label htmlFor="maintainStock" className="cursor-pointer">
              Maintain Stock
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="allowNegativeStock"
              checked={formData.allowNegativeStock}
              onCheckedChange={(checked) =>
                onUpdate({ allowNegativeStock: checked === true })
              } />
            <Label htmlFor="allowNegativeStock" className="cursor-pointer">
              Allow Negative Stock
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Valuation Method</Label>
          <Select value={formData.valuationMethod}
            onValueChange={(value) => onUpdate({ valuationMethod: value })}>
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
            <Input id="barcode"
              value={formData.barcode}
              onChange={(e) => onUpdate({ barcode: e.target.value })}
              placeholder="Enter barcode" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => onUpdate({ imageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold border-b pb-2">Packaging Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="packagingUnitName">Base Unit Name</Label>
            <Input id="packagingUnitName"
              value={formData.packagingUnitName}
              onChange={(e) => onUpdate({ packagingUnitName: e.target.value })}
              placeholder="Each" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="packagingConversionFactor">Conversion Factor</Label>
            <Input id="packagingConversionFactor"
              type="number"
              step="1"
              min="1"
              value={formData.packagingConversionFactor}
              onChange={(e) => onUpdate({ packagingConversionFactor: e.target.value })}
              placeholder="1" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="packagingItemsPerMasterPack">Items per Master Pack</Label>
            <Input id="packagingItemsPerMasterPack"
              type="number"
              step="1"
              min="1"
              value={formData.packagingItemsPerMasterPack}
              onChange={(e) => onUpdate({ packagingItemsPerMasterPack: e.target.value })}
              placeholder="10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="packagingLengthMm">Length (mm)</Label>
            <Input id="packagingLengthMm"
              type="number" step="0.1" min="0"
              value={formData.packagingLengthMm}
              onChange={(e) => onUpdate({ packagingLengthMm: e.target.value })}
              placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="packagingWidthMm">Width (mm)</Label>
            <Input id="packagingWidthMm"
              type="number" step="0.1" min="0"
              value={formData.packagingWidthMm}
              onChange={(e) => onUpdate({ packagingWidthMm: e.target.value })}
              placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="packagingHeightMm">Height (mm)</Label>
            <Input id="packagingHeightMm"
              type="number" step="0.1" min="0"
              value={formData.packagingHeightMm}
              onChange={(e) => onUpdate({ packagingHeightMm: e.target.value })}
              placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="packagingWeightGrams">Weight (g)</Label>
            <Input id="packagingWeightGrams"
              type="number" step="0.1" min="0"
              value={formData.packagingWeightGrams}
              onChange={(e) => onUpdate({ packagingWeightGrams: e.target.value })}
              placeholder="0" />
          </div>
        </div>
      </div>
    </div>
  );
}
