import * as React from 'react';

import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components/ui/select';

import type { TaxTemplate } from '../../../types/tax-template.types';
import type { ItemFormData } from '../../../utility/item-payload-builders';

interface Step3TaxAdditionalProps {
    formData: ItemFormData;
    onUpdate: (updates: Partial<ItemFormData>) => void;
    salesTaxTemplates: TaxTemplate[];
    purchaseTaxTemplates: TaxTemplate[];
    isLoadingTaxTemplates: boolean;
}

export const Step3TaxAdditional = React.memo(function Step3TaxAdditional({
    formData,
    onUpdate,
    salesTaxTemplates,
    purchaseTaxTemplates,
    isLoadingTaxTemplates,
}: Step3TaxAdditionalProps) {
    return (
        <div className="grid gap-6 py-4">
            {/* Barcode & Image */}
            <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Additional Info</h3>

                <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input id="barcode"
                        value={formData.barcode}
                        onChange={(e) => onUpdate({ barcode: e.target.value })}
                        placeholder="Enter barcode"/>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="imageUrl">Primary Image URL</Label>
                    <Input id="imageUrl"
                        value={formData.imageUrl}
                        onChange={(e) => onUpdate({ imageUrl: e.target.value })}
                        placeholder="https://example.com/image.jpg"/>
                </div>
            </div>

            {/* Tax Templates */}
            <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Tax Templates</h3>

                <div className="space-y-2">
                    <Label htmlFor="salesTaxTemplateId">Sales Tax Template</Label>
                    <Select
                        value={formData.salesTaxTemplateId ?? 'none'}
                        onValueChange={(v) => onUpdate({ salesTaxTemplateId: v === 'none' ? null : v })}
                        disabled={isLoadingTaxTemplates}>
                        <SelectTrigger id="salesTaxTemplateId">
                            <SelectValue placeholder={isLoadingTaxTemplates ? 'Loading...' : 'Select sales tax template'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {salesTaxTemplates.map((t) => (
                                <SelectItem key={t.id} value={t.id}>{t.template_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="purchaseTaxTemplateId">Purchase Tax Template</Label>
                    <Select
                        value={formData.purchaseTaxTemplateId ?? 'none'}
                        onValueChange={(v) => onUpdate({ purchaseTaxTemplateId: v === 'none' ? null : v })}
                        disabled={isLoadingTaxTemplates}>
                        <SelectTrigger id="purchaseTaxTemplateId">
                            <SelectValue placeholder={isLoadingTaxTemplates ? 'Loading...' : 'Select purchase tax template'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {purchaseTaxTemplates.map((t) => (
                                <SelectItem key={t.id} value={t.id}>{t.template_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
});
