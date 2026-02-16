import * as React from 'react';

import { Checkbox } from '@horizon-sync/ui/components/ui/checkbox';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';

import { WEIGHT_UOM_OPTIONS } from '../../../constants/item-type-constants';
import type { ItemFormData } from '../../../utility/item-payload-builders';

interface Step2PricingOrderingProps {
    formData: ItemFormData;
    setFormData: React.Dispatch<React.SetStateAction<ItemFormData & { itemGroupName: string }>>;
}

export function Step2PricingOrdering({ formData, setFormData }: Step2PricingOrderingProps) {
    return (
        <div className="grid gap-6 py-4">
            {/* Pricing Section */}
            <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Pricing & Valuation</h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="standardRate">
                            Standard Rate <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="standardRate"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.defaultPrice}
                            onChange={(e) => setFormData((prev) => ({ ...prev, defaultPrice: e.target.value }))}
                            placeholder="0.00"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="valuationRate">Valuation Rate</Label>
                        <Input
                            id="valuationRate"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.valuationRate}
                            onChange={(e) => setFormData((prev) => ({ ...prev, valuationRate: e.target.value }))}
                            placeholder="0.00"
                        />
                    </div>
                </div>
            </div>

            {/* Weight Information Section */}
            <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Weight Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="weightPerUnit">Weight Per Unit</Label>
                        <Input
                            id="weightPerUnit"
                            type="number"
                            step="0.001"
                            min="0"
                            value={formData.weightPerUnit}
                            onChange={(e) => setFormData((prev) => ({ ...prev, weightPerUnit: e.target.value }))}
                            placeholder="0.000"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="weightUom">Weight UOM</Label>
                        <Select
                            value={formData.weightUom}
                            onValueChange={(value) => setFormData((prev) => ({ ...prev, weightUom: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                                {WEIGHT_UOM_OPTIONS.map((unit) => (
                                    <SelectItem key={unit} value={unit}>
                                        {unit}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Reordering Section */}
            <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Reordering</h3>
                
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
                    <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-muted">
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

            {/* Quality Inspection Section */}
            <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Quality Inspection</h3>
                
                <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="inspectionRequiredBeforePurchase"
                            checked={formData.inspectionRequiredBeforePurchase}
                            onCheckedChange={(checked) =>
                                setFormData((prev) => ({ ...prev, inspectionRequiredBeforePurchase: checked === true }))
                            }
                        />
                        <Label htmlFor="inspectionRequiredBeforePurchase" className="cursor-pointer">
                            Inspection Required Before Purchase
                        </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="inspectionRequiredBeforeDelivery"
                            checked={formData.inspectionRequiredBeforeDelivery}
                            onCheckedChange={(checked) =>
                                setFormData((prev) => ({ ...prev, inspectionRequiredBeforeDelivery: checked === true }))
                            }
                        />
                        <Label htmlFor="inspectionRequiredBeforeDelivery" className="cursor-pointer">
                            Inspection Required Before Delivery
                        </Label>
                    </div>
                </div>

                {(formData.inspectionRequiredBeforePurchase || formData.inspectionRequiredBeforeDelivery) && (
                    <div className="space-y-2 pl-6 border-l-2 border-muted">
                        <Label htmlFor="qualityInspectionTemplate">Quality Inspection Template ID</Label>
                        <Input
                            id="qualityInspectionTemplate"
                            value={formData.qualityInspectionTemplate || ''}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, qualityInspectionTemplate: e.target.value || null }))
                            }
                            placeholder="Enter template ID"
                        />
                        <p className="text-xs text-muted-foreground">
                            Optional: Specify a quality inspection template to use for this item
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
