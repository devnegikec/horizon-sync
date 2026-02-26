import * as React from 'react';

import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';

import { WEIGHT_UOM_OPTIONS } from '../../../constants/item-type-constants';
import type { ItemFormData } from '../../../utility/item-payload-builders';

interface PricingValuationStepProps {
    formData: ItemFormData;
    setFormData: React.Dispatch<React.SetStateAction<ItemFormData & { itemGroupName: string }>>;
}

export function PricingValuationStep({ formData, setFormData }: PricingValuationStepProps) {
    return (
        <div className="grid gap-4 py-4">
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

            <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Weight Information</h4>
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
        </div>
    );
}
