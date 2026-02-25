import { useEffect } from 'react';

import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import { ITEM_TYPE_OPTIONS, ITEM_STATUS_OPTIONS } from '../../../constants/item-type-constants';
import { useUOMOptions } from '../../../hooks/useUOMOptions';
import type { ApiItemGroup } from '../../../types/item-groups.types';
import type { ItemFormData } from '../../../utility/item-payload-builders';
import { FilterSelect } from '../../shared/FilterSelect';

interface Step1BasicInfoProps {
  formData: ItemFormData;
  onUpdate: (data: Partial<ItemFormData>) => void;
  itemGroups: ApiItemGroup[];
  accessToken: string;
}

export function Step1BasicInfo({ formData, onUpdate, itemGroups, accessToken }: Step1BasicInfoProps) {
  const hasItemGroups = itemGroups.length > 0;
  const { options: uomOptions, loading: uomLoading } = useUOMOptions(accessToken);

  // Auto-select defaults on mount
  useEffect(() => {
    const updates: Partial<ItemFormData> = {};
    if (!formData.itemType) updates.itemType = ITEM_TYPE_OPTIONS[0];
    if (!formData.status) updates.status = ITEM_STATUS_OPTIONS[0];
    if (Object.keys(updates).length > 0) onUpdate(updates);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Enter the essential details for your item
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="itemCode">Item Code</Label>
          <Input id="itemCode"
            value={formData.itemCode}
            disabled
            placeholder="Auto-generated"/>
        </div>

        <div className="space-y-2">
          <Label htmlFor="itemName">
            Item Name <span className="text-red-500">*</span>
          </Label>
          <Input id="itemName"
            value={formData.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Enter item name"
            required/>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description"
          value={formData.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Enter item description"
          rows={3}/>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>
            Item Group <span className="text-red-500">*</span>
          </Label>
          {hasItemGroups ? (
            <Select value={formData.itemGroupId} onValueChange={(value) => onUpdate({ itemGroupId: value })}>
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
          <Select value={formData.itemType} onValueChange={(value) => onUpdate({ itemType: value })}>
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
          <FilterSelect value={formData.unitOfMeasure}
            onValueChange={(value) => onUpdate({ unitOfMeasure: value })}
            options={uomOptions}
            placeholder="Select unit"
            loading={uomLoading}/>
        </div>

        <div className="space-y-2">
          <Label>
            Status <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.status} onValueChange={(value) => onUpdate({ status: value })}>
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
  );
}
