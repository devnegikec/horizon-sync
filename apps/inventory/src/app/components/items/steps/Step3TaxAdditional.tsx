import * as React from 'react';

import { Label } from '@horizon-sync/ui/components/ui/label';
import { Input } from '@horizon-sync/ui/components/ui/input';

import type { TaxTemplate } from '../../../types/tax-template.types';
import type { ItemFormData } from '../../../utility/item-payload-builders';

interface Step3TaxAdditionalProps {
    formData: ItemFormData;
    setFormData: React.Dispatch<React.SetStateAction<ItemFormData & { itemGroupName: string }>>;
    salesTaxTemplates: TaxTemplate[];
    purchaseTaxTemplates: TaxTemplate[];
    isLoadingTaxTemplates: boolean;
}

export const Step3TaxAdditional = React.memo(function Step3TaxAdditional({
    formData,
    setFormData,
}: Step3TaxAdditionalProps) {
    return (
        <div className="grid gap-6 py-4">
            {/* Basic Test Section */}
            <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Basic Information</h3>
                
                <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input
                        id="barcode"
                        value={formData.barcode}
                        onChange={(e) => setFormData((prev) => ({ ...prev, barcode: e.target.value }))}
                        placeholder="Enter barcode"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="imageUrl">Primary Image URL</Label>
                    <Input
                        id="imageUrl"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                        placeholder="https://example.com/image.jpg"
                    />
                </div>
            </div>
        </div>
    );
});
