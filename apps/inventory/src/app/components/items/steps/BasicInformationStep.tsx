import * as React from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import { UNIT_OF_MEASURE_OPTIONS } from '../../../constants/item-constants';
import { ITEM_TYPE_OPTIONS, ITEM_STATUS_OPTIONS } from '../../../constants/item-type-constants';
import type { ApiItemGroup } from '../../../types/item-groups.types';
import type { ItemFormData } from '../../../utility/item-payload-builders';

interface BasicInformationStepProps {
    formData: ItemFormData & { itemGroupName: string };
    setFormData: React.Dispatch<React.SetStateAction<ItemFormData & { itemGroupName: string }>>;
    itemGroups: ApiItemGroup[];
    onCreateItemGroup?: () => void;
}

export function BasicInformationStep({
    formData,
    setFormData,
    itemGroups,
    onCreateItemGroup,
}: BasicInformationStepProps) {
    const hasItemGroups = itemGroups.length > 0;

    return (
        <div className="grid gap-4 py-4">
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
                    <Label htmlFor="itemGroup">
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
                    <Label htmlFor="itemType">
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
                    <Label htmlFor="unitOfMeasure">
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
                    <Label htmlFor="status">
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
    );
}
