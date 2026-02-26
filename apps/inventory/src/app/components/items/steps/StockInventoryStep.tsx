import * as React from 'react';

import { Checkbox } from '@horizon-sync/ui/components/ui/checkbox';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import { VALUATION_METHOD_OPTIONS } from '../../../constants/item-type-constants';
import type { ItemFormData } from '../../../utility/item-payload-builders';

interface StockInventoryStepProps {
    formData: ItemFormData;
    setFormData: React.Dispatch<React.SetStateAction<ItemFormData & { itemGroupName: string }>>;
}

export function StockInventoryStep({ formData, setFormData }: StockInventoryStepProps) {
    return (
        <div className="grid gap-4 py-4">
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
                <Label htmlFor="valuationMethod">Valuation Method</Label>
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

            <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Variants</h4>
                <div className="grid gap-4">
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
                        <>
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
                        </>
                    )}
                </div>
            </div>

            <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Batch & Serial Numbers</h4>
                <div className="grid gap-4">
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
            </div>
        </div>
    );
}
