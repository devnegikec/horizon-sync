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

const SKU_PATTERN = /^[a-zA-Z0-9-]*$/;

// eslint-disable-next-line complexity
function NameField({ value, onUpdate, markTouched, showError, showMaxError }: {
  value: string;
  onUpdate: (data: Partial<ItemFormData>) => void;
  markTouched: () => void;
  showError: boolean;
  showMaxError: boolean;
}) {
  const isAtLimit = (value?.length || 0) >= 255;
  const hasError = showError || showMaxError || isAtLimit;

  return (
    <div className="space-y-2">
      <Label htmlFor="itemName">
        Item Name <span className="text-red-500">*</span>
      </Label>
      <Input id="itemName"
        value={value}
        onChange={(e) => onUpdate({ name: e.target.value })}
        onBlur={markTouched}
        placeholder="Enter item name"
        className={cn(hasError && 'border-red-500')}
        required/>
      {showError && (
        <p className="text-xs text-red-500">Item name is required</p>
      )}
      {isAtLimit && (
        <p className="text-xs text-red-500">Item name cannot exceed 255 characters</p>
      )}
      <p className={cn('text-xs text-right', isAtLimit ? 'text-red-500 font-medium' : 'text-muted-foreground')}>{value?.length || 0}/255</p>
    </div>
  );
}

// eslint-disable-next-line complexity
function SKUField({ value, onUpdate, markTouched, touched }: {
  value: string;
  onUpdate: (data: Partial<ItemFormData>) => void;
  markTouched: () => void;
  touched: boolean;
}) {
  const isAtLimit = (value?.length || 0) > 100;
  const isInvalidChars = value.length > 0 && !SKU_PATTERN.test(value);
  const hasError = touched && (isAtLimit || isInvalidChars);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only alphanumeric and hyphens
    const raw = e.target.value;
    if (raw === '' || SKU_PATTERN.test(raw)) {
      onUpdate({ sku: raw });
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="itemSku">SKU</Label>
      <Input id="itemSku"
        value={value}
        onChange={handleChange}
        onBlur={markTouched}
        placeholder="e.g. WIDGET-001"
        className={cn(hasError && 'border-red-500')}
        maxLength={100}/>
      {touched && isAtLimit && (
        <p className="text-xs text-red-500">SKU cannot exceed 100 characters</p>
      )}
      {touched && isInvalidChars && (
        <p className="text-xs text-red-500">SKU can only contain letters, numbers, and hyphens</p>
      )}
      <p className={cn('text-xs text-right', isAtLimit ? 'text-red-500 font-medium' : 'text-muted-foreground')}>{value?.length || 0}/100</p>
    </div>
  );
}

function DescriptionField({ value, onUpdate, markTouched }: {
  value: string;
  onUpdate: (data: Partial<ItemFormData>) => void;
  markTouched: () => void;
}) {
  const isAtLimit = (value?.length || 0) >= 1000;

  return (
    <div className="space-y-2">
      <Label htmlFor="description">Description</Label>
      <Textarea id="description"
        value={value}
        onChange={(e) => onUpdate({ description: e.target.value })}
        onBlur={markTouched}
        placeholder="Enter item description"
        className={cn(isAtLimit && 'border-red-500')}
        rows={3}/>
      {isAtLimit && (
        <p className="text-xs text-red-500">Description cannot exceed 1000 characters</p>
      )}
      <p className={cn('text-xs text-right', isAtLimit ? 'text-red-500 font-medium' : 'text-muted-foreground')}>{value?.length || 0}/1000</p>
    </div>
  );
}

export function Step1BasicInfo({ formData, onUpdate, itemGroups, accessToken }: Step1BasicInfoProps) {
  const hasItemGroups = itemGroups.length > 0;
  const { options: uomOptions, loading: uomLoading } = useUOMOptions(accessToken);

  // Track which fields have been interacted with to show validation errors
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const markTouched = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  const showError = (field: string, value: string | undefined | null) =>
    touched[field] && !value?.trim();

  const showMaxError = (field: string, value: string | undefined | null, max: number) =>
    touched[field] && (value?.length || 0) > max;

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
        <NameField value={formData.name} onUpdate={onUpdate} markTouched={() => markTouched('name')} showError={!!showError('name', formData.name)} showMaxError={!!showMaxError('name', formData.name, 255)} />

        <SKUField value={formData.sku} onUpdate={onUpdate} markTouched={() => markTouched('sku')} touched={!!touched['sku']} />
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

      <DescriptionField value={formData.description} onUpdate={onUpdate} markTouched={() => markTouched('description')} />
    </div>
  );
}
