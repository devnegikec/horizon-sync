import * as React from 'react';

import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import { UNIT_OF_MEASURE_OPTIONS } from '../../constants/item-constants';
import type { ApiItemGroup } from '../../types/item-groups.types';
import type { ItemFormData } from '../../utility/item-payload-builders';

interface ItemFormFieldsProps {
  formData: ItemFormData & { itemGroupName: string };
  setFormData: React.Dispatch<React.SetStateAction<ItemFormData & { itemGroupName: string }>>;
  itemGroups: ApiItemGroup[];
}

export function ItemFormFields({ formData, setFormData, itemGroups }: ItemFormFieldsProps) {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="itemCode">Item Code</Label>
          <Input id="itemCode"
            value={formData.itemCode}
            onChange={(e) => setFormData((prev) => ({ ...prev, itemCode: e.target.value }))}
            placeholder="e.g., ELEC-001"
            required/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="unitOfMeasure">Unit of Measure</Label>
          <Select value={formData.unitOfMeasure} onValueChange={(value) => setFormData((prev) => ({ ...prev, unitOfMeasure: value }))}>
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Item Name</Label>
        <Input id="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Enter item name"
          required/>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Enter item description"
          rows={3}/>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="itemGroup">Item Group</Label>
          <Select value={formData.itemGroupId} onValueChange={(value) => setFormData((prev) => ({ ...prev, itemGroupId: value }))}>
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
        </div>
        <div className="space-y-2">
          <Label htmlFor="defaultPrice">Default Price</Label>
          <Input id="defaultPrice"
            type="number"
            step="0.01"
            min="0"
            value={formData.defaultPrice}
            onChange={(e) => setFormData((prev) => ({ ...prev, defaultPrice: e.target.value }))}
            placeholder="0.00"
            required/>
        </div>
      </div>
    </div>
  );
}
