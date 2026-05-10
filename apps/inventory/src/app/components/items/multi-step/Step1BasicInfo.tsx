import * as React from 'react';

import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';
import { cn } from '@horizon-sync/ui/lib';

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

  // Track which fields have been interacted with to show validation errors
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const markTouched = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  const showError = (field: string, value: string | undefined | null) =>
    touched[field] && !value?.trim();

  // Auto-select the first UOM option as default once options are loaded
  React.useEffect(() => {
    if (uomOptions.length > 0 && !uomOptions.some((opt) => opt.value === formData.unitOfMeasure)) {
      onUpdate({ unitOfMeasure: uomOptions[0].value });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uomOptions]);

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
            onBlur={() => markTouched('name')}
            placeholder="Enter item name"
            className={cn(showError('name', formData.name) && 'border-red-500')}
            required/>
          {showError('name', formData.name) && (
            <p className="text-xs text-red-500">Item name is required</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>
            Item Group <span className="text-red-500">*</span>
          </Label>
          {hasItemGroups ? (
            <>
              <Select value={formData.itemGroupId} onValueChange={(value) => { onUpdate({ itemGroupId: value }); markTouched('itemGroupId'); }}>
                <SelectTrigger className={cn(showError('itemGroupId', formData.itemGroupId) && 'border-red-500')}>
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
              {showError('itemGroupId', formData.itemGroupId) && (
                <p className="text-xs text-red-500">Item group is required</p>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-10 px-3 py-2 border border-dashed border-muted-foreground/25 rounded-md bg-muted/50">
              <span className="text-sm text-muted-foreground">No item groups available</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label>
            Unit of Measure
          </Label>
          <FilterSelect value={formData.unitOfMeasure}
            onValueChange={(value) => { onUpdate({ unitOfMeasure: value }); markTouched('unitOfMeasure'); }}
            options={uomOptions}
            placeholder="Select unit"
            listMaxHeight="max-h-32"
            loading={uomLoading}/>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>
            Item Type
          </Label>
          <Select value={formData.itemType || ITEM_TYPE_OPTIONS[0]} onValueChange={(value) => onUpdate({ itemType: value })}>
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

        <div className="space-y-2">
          <Label>
            Status
          </Label>
          <Select value={formData.status || ITEM_STATUS_OPTIONS[0]} onValueChange={(value) => onUpdate({ status: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {ITEM_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.toLocaleUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
    </div>
  );
}
