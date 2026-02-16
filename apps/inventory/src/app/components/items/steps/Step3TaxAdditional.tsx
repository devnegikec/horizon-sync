import * as React from 'react';
import { X } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

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
    salesTaxTemplates,
    purchaseTaxTemplates,
    isLoadingTaxTemplates,
}: Step3TaxAdditionalProps) {
    const [imageInput, setImageInput] = React.useState('');
    const [tagInput, setTagInput] = React.useState('');

    const handleAddImage = React.useCallback(() => {
        if (imageInput.trim()) {
            setFormData((prev) => ({
                ...prev,
                images: [...prev.images, imageInput.trim()],
            }));
            setImageInput('');
        }
    }, [imageInput, setFormData]);

    const handleRemoveImage = React.useCallback((index: number) => {
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    }, [setFormData]);

    const handleAddTag = React.useCallback(() => {
        if (tagInput.trim()) {
            setFormData((prev) => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()],
            }));
            setTagInput('');
        }
    }, [tagInput, setFormData]);

    const handleRemoveTag = React.useCallback((index: number) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((_, i) => i !== index),
        }));
    }, [setFormData]);

    const handleSalesTaxChange = React.useCallback((value: string) => {
        setFormData((prev) => ({ ...prev, salesTaxTemplateId: value || null }));
    }, [setFormData]);

    const handlePurchaseTaxChange = React.useCallback((value: string) => {
        setFormData((prev) => ({ ...prev, purchaseTaxTemplateId: value || null }));
    }, [setFormData]);

    const handleBarcodeChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, barcode: e.target.value }));
    }, [setFormData]);

    const handleImageUrlChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, imageUrl: e.target.value }));
    }, [setFormData]);

    const handleCustomFieldsChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        try {
            const parsed = JSON.parse(e.target.value);
            setFormData((prev) => ({ ...prev, customFields: parsed }));
        } catch {
            // Invalid JSON, don't update
        }
    }, [setFormData]);

    return (
        <div className="grid gap-6 py-4">
            {/* Tax Templates Section */}
            <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Tax Templates</h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="salesTaxTemplate">Sales Tax Template</Label>
                        <Select
                            value={formData.salesTaxTemplateId || ''}
                            onValueChange={handleSalesTaxChange}
                            disabled={isLoadingTaxTemplates}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select sales tax template" />
                            </SelectTrigger>
                            <SelectContent>
                                {salesTaxTemplates.map((template) => (
                                    <SelectItem key={template.id} value={template.id}>
                                        {template.template_name} ({template.template_code})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="purchaseTaxTemplate">Purchase Tax Template</Label>
                        <Select
                            value={formData.purchaseTaxTemplateId || ''}
                            onValueChange={handlePurchaseTaxChange}
                            disabled={isLoadingTaxTemplates}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select purchase tax template" />
                            </SelectTrigger>
                            <SelectContent>
                                {purchaseTaxTemplates.map((template) => (
                                    <SelectItem key={template.id} value={template.id}>
                                        {template.template_name} ({template.template_code})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Product Identification Section */}
            <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Product Identification</h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="barcode">Barcode</Label>
                        <Input
                            id="barcode"
                            value={formData.barcode}
                            onChange={handleBarcodeChange}
                            placeholder="Enter barcode"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="imageUrl">Primary Image URL</Label>
                        <Input
                            id="imageUrl"
                            value={formData.imageUrl}
                            onChange={handleImageUrlChange}
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>
                </div>
            </div>

            {/* Additional Images Section */}
            <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Additional Images</h3>
                
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <Input
                            value={imageInput}
                            onChange={(e) => setImageInput(e.target.value)}
                            placeholder="Enter image URL"
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
                        />
                        <Button type="button" onClick={handleAddImage} variant="outline" size="sm">
                            Add
                        </Button>
                    </div>
                    {formData.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {formData.images.map((image, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-sm"
                                >
                                    <span className="truncate max-w-[200px]">{image}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(index)}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Tags Section */}
            <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Tags</h3>
                
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <Input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            placeholder="Enter tag"
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        />
                        <Button type="button" onClick={handleAddTag} variant="outline" size="sm">
                            Add
                        </Button>
                    </div>
                    {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {formData.tags.map((tag, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-sm"
                                >
                                    <span>{tag}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(index)}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Fields Section */}
            <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Custom Fields (JSON)</h3>
                
                <Textarea
                    value={JSON.stringify(formData.customFields, null, 2)}
                    onChange={handleCustomFieldsChange}
                    placeholder='{"key": "value"}'
                    rows={4}
                />
            </div>
        </div>
    );
});
