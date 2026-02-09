import * as React from 'react';

import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';

import { UNIT_OF_MEASURE_OPTIONS } from '../../constants/item-constants';
import type { ItemGroupFormData } from '../../types/item-group-creation.types';

interface CreateItemGroupFormProps {
  formData: ItemGroupFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItemGroupFormData>>;
}

export function CreateItemGroupForm({ formData, setFormData }: CreateItemGroupFormProps) {
  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="groupName">Group Name *</Label>
        <Input
          id="groupName"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Electronics"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="groupCode">Group Code *</Label>
        <Input
          id="groupCode"
          value={formData.code}
          onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
          placeholder="e.g., ELEC"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultUom">Default Unit of Measure *</Label>
        <Select 
          value={formData.default_uom} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, default_uom: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select default unit" />
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
  );
}