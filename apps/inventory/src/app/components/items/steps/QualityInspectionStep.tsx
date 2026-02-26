import * as React from 'react';

import { Checkbox } from '@horizon-sync/ui/components/ui/checkbox';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';

import type { ItemFormData } from '../../../utility/item-payload-builders';

interface QualityInspectionStepProps {
    formData: ItemFormData;
    setFormData: React.Dispatch<React.SetStateAction<ItemFormData & { itemGroupName: string }>>;
}

export function QualityInspectionStep({ formData, setFormData }: QualityInspectionStepProps) {
    return (
        <div className="grid gap-4 py-4">
            <div className="space-y-4">
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
                <div className="space-y-2 border-t pt-4">
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
    );
}
