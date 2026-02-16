import * as React from 'react';

import { Plus } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import { UNIT_OF_MEASURE_OPTIONS } from '../../constants/item-constants';
import type { ApiItemGroup } from '../../types/item-groups.types';
import type { CreateItemGroupResponse } from '../../types/item-group-creation.types';
import type { ItemFormData } from '../../utility/item-payload-builders';

import { CreateItemGroupModal } from './CreateItemGroupModal';

interface ItemFormFieldsProps {
  formData: ItemFormData & { itemGroupName: string };
  setFormData: React.Dispatch<React.SetStateAction<ItemFormData & { itemGroupName: string }>>;
  itemGroups: ApiItemGroup[];
  onItemGroupsRefresh?: () => void;
}

export function ItemFormFields({
  formData,
  setFormData,
  itemGroups,
  onItemGroupsRefresh
}: ItemFormFieldsProps) {
  const [createGroupModalOpen, setCreateGroupModalOpen] = React.useState(false);

  const handleItemGroupCreated = (newItemGroup: CreateItemGroupResponse) => {
    // Auto-select the newly created item group
    setFormData(prev => ({
      ...prev,
      itemGroupId: newItemGroup.id,
      itemGroupName: newItemGroup.name
    }));

    // Refresh the item groups list if callback is provided
    onItemGroupsRefresh?.();
  };

  const hasItemGroups = itemGroups.length > 0;

  return (
    <>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="itemCode">Item Code</Label>
            <Input id="itemCode"
              value={formData.itemCode}
              onChange={(e) => setFormData((prev) => ({ ...prev, itemCode: e.target.value }))}
              placeholder="e.g., ELEC-001"
              required />
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
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter item name"
                required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemGroup">Item Group</Label>

              {hasItemGroups ? (
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
              ) : (
                <div className="flex items-center justify-center h-10 px-3 py-2 border border-dashed border-muted-foreground/25 rounded-md bg-muted/50">
                  <span className="text-sm text-muted-foreground">No item groups available</span>
                </div>
              )}
            </div>
          </div>
        </div>


        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Enter item description"
            rows={3} />
        </div>

        <div className="grid grid-cols-2 gap-4">

          <div className="space-y-2">
            <Label htmlFor="defaultPrice">Default Price</Label>
            <Input id="defaultPrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.defaultPrice}
              onChange={(e) => setFormData((prev) => ({ ...prev, defaultPrice: e.target.value }))}
              placeholder="0.00"
              required />
          </div>
        </div>
      </div>

      <CreateItemGroupModal
        open={createGroupModalOpen}
        onOpenChange={setCreateGroupModalOpen}
        onItemGroupCreated={handleItemGroupCreated}
      />
    </>
  );
}
