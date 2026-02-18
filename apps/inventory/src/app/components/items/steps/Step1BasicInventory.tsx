import * as React from 'react';

import { Checkbox } from '@horizon-sync/ui/components/ui/checkbox';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import { UNIT_OF_MEASURE_OPTIONS } from '../../../constants/item-constants';
import { ITEM_TYPE_OPTIONS, ITEM_STATUS_OPTIONS, VALUATION_METHOD_OPTIONS } from '../../../constants/item-type-constants';
import type { ApiItemGroup } from '../../../types/item-groups.types';
import type { ItemFormData } from '../../../utility/item-payload-builders';

interface Step1BasicInventoryProps {
    formData: ItemFormData & { itemGroupName: string };
    setFormData: React.Dispatch<React.SetStateAction<ItemFormData & { itemGroupName: string }>>;
    itemGroups: ApiItemGroup[];
}

export function Step1BasicInventory({
    formData,
    setFormData,
    itemGroups,
}: Step1BasicInventoryProps) {
    const hasItemGroups = itemGroups.length > 0;

    return (
        <div className="grid gap-6 py-4">
            {/* Basic Information Section */}
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

            {/* Stock & Inventory Section */}
            <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Stock & Inventory</h3>
                
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
            </div>

            {/* Variants Section */}
            <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Variants</h3>
                
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="hasVariants"
                        checked={formData.hasVariants}
                        onCheckedChange={(checked) =>
                            setFormData((prev) => ({ ...prev, hasVariants: checked === true }))
                        }
                    />
                    <Label htmlFor="hasVariants" className="cursor-pointer">
                        Has Variants
                    </Label>
                </div>

                {formData.hasVariants && (
                    <div className="grid gap-4 pl-6 border-l-2 border-muted">
                        <div className="space-y-2">
                            <Label htmlFor="variantOf">Variant Of (Item ID)</Label>
                            <Input
                                id="variantOf"
                                value={formData.variantOf || ''}
                                onChange={(e) => setFormData((prev) => ({ ...prev, variantOf: e.target.value || null }))}
                                placeholder="Parent item ID"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="variantAttributes">Variant Attributes (JSON)</Label>
                            <Textarea
                                id="variantAttributes"
                                value={JSON.stringify(formData.variantAttributes, null, 2)}
                                onChange={(e) => {
                                    try {
                                        const parsed = JSON.parse(e.target.value);
                                        setFormData((prev) => ({ ...prev, variantAttributes: parsed }));
                                    } catch {
                                        // Invalid JSON, don't update
                                    }
                                }}
                                placeholder='{"color": "red", "size": "large"}'
                                rows={3}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Batch & Serial Numbers Section */}
            <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Batch & Serial Numbers</h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="hasBatchNo"
                            checked={formData.hasBatchNo}
                            onCheckedChange={(checked) =>
                                setFormData((prev) => ({ ...prev, hasBatchNo: checked === true }))
                            }
                        />
                        <Label htmlFor="hasBatchNo" className="cursor-pointer">
                            Has Batch Number
                        </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="hasSerialNo"
                            checked={formData.hasSerialNo}
                            onCheckedChange={(checked) =>
                                setFormData((prev) => ({ ...prev, hasSerialNo: checked === true }))
                            }
                        />
                        <Label htmlFor="hasSerialNo" className="cursor-pointer">
                            Has Serial Number
                        </Label>
                    </div>
                </div>

                {(formData.hasBatchNo || formData.hasSerialNo) && (
                    <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-muted">
                        {formData.hasBatchNo && (
                            <div className="space-y-2">
                                <Label htmlFor="batchNumberSeries">Batch Number Series</Label>
                                <Input
                                    id="batchNumberSeries"
                                    value={formData.batchNumberSeries}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, batchNumberSeries: e.target.value }))}
                                    placeholder="e.g., BATCH-"
                                />
                            </div>
                        )}

                        {formData.hasSerialNo && (
                            <div className="space-y-2">
                                <Label htmlFor="serialNumberSeries">Serial Number Series</Label>
                                <Input
                                    id="serialNumberSeries"
                                    value={formData.serialNumberSeries}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, serialNumberSeries: e.target.value }))}
                                    placeholder="e.g., SN-"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
