import * as React from 'react';

import { Checkbox } from '@horizon-sync/ui/components/ui/checkbox';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';

import type { ItemFormData } from '../../../utility/item-payload-builders';

interface ReorderingStepProps {
    formData: ItemFormData;
    setFormData: React.Dispatch<React.SetStateAction<ItemFormData & { itemGroupName: string }>>;
}

export function ReorderingStep({ formData, setFormData }: ReorderingStepProps) {
    return (
        <div className="grid gap-4 py-4">
            <div className="flex items-center space-x-2">
                <Checkbox
                    id="enableAutoReorder"
                    checked={formData.enableAutoReorder}
                    onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, enableAutoReorder: checked === true }))
                    }
                />
                <Label htmlFor="enableAutoReorder" className="cursor-pointer">
                    Enable Auto Reorder
                </Label>
            </div>

            {formData.enableAutoReorder && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="reorderLevel">Reorder Level</Label>
                        <Input
                            id="reorderLevel"
                            type="number"
                            min="0"
                            value={formData.reorderLevel}
                            onChange={(e) => setFormData((prev) => ({ ...prev, reorderLevel: parseInt(e.target.value) || 0 }))}
                            placeholder="0"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reorderQty">Reorder Quantity</Label>
                        <Input
                            id="reorderQty"
                            type="number"
                            min="0"
                            value={formData.reorderQty}
                            onChange={(e) => setFormData((prev) => ({ ...prev, reorderQty: parseInt(e.target.value) || 0 }))}
                            placeholder="0"
                        />
                    </div>
                </div>
            )}

            <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Order Quantity Limits</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="minOrderQty">Minimum Order Quantity</Label>
                        <Input
                            id="minOrderQty"
                            type="number"
                            min="0"
                            value={formData.minOrderQty}
                            onChange={(e) => setFormData((prev) => ({ ...prev, minOrderQty: parseInt(e.target.value) || 0 }))}
                            placeholder="1"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="maxOrderQty">Maximum Order Quantity</Label>
                        <Input
                            id="maxOrderQty"
                            type="number"
                            min="0"
                            value={formData.maxOrderQty}
                            onChange={(e) => setFormData((prev) => ({ ...prev, maxOrderQty: parseInt(e.target.value) || 0 }))}
                            placeholder="0 (unlimited)"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
