import * as React from 'react';

import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';
import { Checkbox } from '@horizon-sync/ui/components/ui/checkbox';

import { UNIT_OF_MEASURE_OPTIONS } from '../../constants/item-constants';
import { ITEM_TYPE_OPTIONS, ITEM_STATUS_OPTIONS, VALUATION_METHOD_OPTIONS, WEIGHT_UOM_OPTIONS } from '../../constants/item-type-constants';
import type { ApiItemGroup } from '../../types/item-groups.types';
import type { ItemFormData } from '../../utility/item-payload-builders';
import type { TaxTemplate } from '../../types/tax-template.types';

interface SimpleItemFormFieldsProps {
  formData: ItemFormData & { itemGroupName: string };
  setFormData: React.Dispatch<React.SetStateAction<ItemFormData & { itemGroupName: string }>>;
  itemGroups: ApiItemGroup[];
  salesTaxTemplates?: TaxTemplate[];
  purchaseTaxTemplates?: TaxTemplate[];
  isLoadingTaxTemplates?: boolean;
}

export function SimpleItemFormFields({
  formData,
  setFormData,
  itemGroups,
  salesTaxTemplates = [],
  purchaseTaxTemplates = [],
  isLoadingTaxTemplates = false,
}: SimpleItemFormFieldsProps) {
  const hasItemGroups = itemGroups.length > 0;

  return (
    <div className="grid gap-6 py-4 max-h-[60vh] overflow-y-scroll pr-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold border-b pb-2">Basic Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="itemCode">
              Item Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="itemCode"
              value={formData.itemCode}
              onChange={(e) => setFormData((prev) => ({ ...prev, itemCode: e.target.value }))}
              placeholder="e.g., ELEC-001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="itemName">
              Item Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="itemName"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter item name"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Enter item description"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>
              Item Group <span className="text-red-500">*</span>
            </Label>
            {hasItemGroups ? (
              <Select
                value={formData.itemGroupId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, itemGroupId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {itemGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center justify-center h-10 px-3 py-2 border border-dashed border-muted-foreground/25 rounded-md bg-muted/50">
                <span className="text-sm text-muted-foreground">No item groups available</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Item Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.itemType}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, itemType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {ITEM_TYPE_OPTIONS.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>
              Unit of Measure <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.unitOfMeasure}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, unitOfMeasure: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {UNIT_OF_MEASURE_OPTIONS.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {ITEM_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold border-b pb-2">Pricing</h3>
        
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
              onChange={(e) => setFormData((prev) => ({ ...prev, defaultPrice: e.target.value }))}
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
              onChange={(e) => setFormData((prev) => ({ ...prev, valuationRate: e.target.value }))}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Stock Settings */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold border-b pb-2">Stock Settings</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="maintainStock"
              checked={formData.maintainStock}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, maintainStock: checked === true }))
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
                setFormData((prev) => ({ ...prev, allowNegativeStock: checked === true }))
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
            onValueChange={(value) => setFormData((prev) => ({ ...prev, valuationMethod: value }))}
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minOrderQty">Minimum Order Quantity</Label>
            <Input
              id="minOrderQty"
              type="number"
              min="1"
              value={formData.minOrderQty || 1}
              onChange={(e) => setFormData((prev) => ({ ...prev, minOrderQty: parseInt(e.target.value) || 1 }))}
              placeholder="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxOrderQty">Maximum Order Quantity</Label>
            <Input
              id="maxOrderQty"
              type="number"
              min="1"
              value={formData.maxOrderQty || 1}
              onChange={(e) => setFormData((prev) => ({ ...prev, maxOrderQty: parseInt(e.target.value) || 1 }))}
              placeholder="1"
            />
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold border-b pb-2">Additional Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode</Label>
            <Input
              id="barcode"
              value={formData.barcode}
              onChange={(e) => setFormData((prev) => ({ ...prev, barcode: e.target.value }))}
              placeholder="Enter barcode"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>
      </div>

      {/* Tax Templates */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold border-b pb-2">Tax Templates</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Sales Tax Template</Label>
            <Select
              value={formData.salesTaxTemplateId || ''}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, salesTaxTemplateId: value || null }))}
              disabled={isLoadingTaxTemplates}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sales tax template" />
              </SelectTrigger>
              <SelectContent>
                {salesTaxTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.template_name} ({template.template_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Purchase Tax Template</Label>
            <Select
              value={formData.purchaseTaxTemplateId || ''}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, purchaseTaxTemplateId: value || null }))}
              disabled={isLoadingTaxTemplates}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select purchase tax template" />
              </SelectTrigger>
              <SelectContent>
                {purchaseTaxTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.template_name} ({template.template_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Custom Fields */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold border-b pb-2">Custom Fields (JSON)</h3>
        
        <div className="space-y-2">
          <Textarea
            value={JSON.stringify(formData.customFields, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setFormData((prev) => ({ ...prev, customFields: parsed }));
              } catch {
                // Invalid JSON, don't update
              }
            }}
            placeholder='{"key": "value"}'
            rows={4}
          />
          <p className="text-xs text-muted-foreground">Enter valid JSON format</p>
        </div>
      </div>
    </div>
  );
}
