import * as React from 'react';
import { X } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

// import { SearchableSelect } from '../../../../platform/src/app/features/search/components/SearchableSelect';
import { SearchableSelect } from '@platform/app/features/search';
import type { TaxTemplate } from '../../../types/tax-template.types';
import type { ItemFormData } from '../../../utility/item-payload-builders';

interface TaxAdditionalStepProps {
    formData: ItemFormData;
    setFormData: React.Dispatch<React.SetStateAction<ItemFormData & { itemGroupName: string }>>;
    salesTaxTemplates: TaxTemplate[];
    purchaseTaxTemplates: TaxTemplate[];
    isLoadingTaxTemplates: boolean;
}

export function TaxAdditionalStep({
    formData,
    setFormData,
    salesTaxTemplates,
    purchaseTaxTemplates,
    isLoadingTaxTemplates,
}: TaxAdditionalStepProps) {
    const [imageInput, setImageInput] = React.useState('');
    const [tagInput, setTagInput] = React.useState('');

    const handleAddImage = () => {
        if (imageInput.trim()) {
            setFormData((prev) => ({
                ...prev,
                images: [...prev.images, imageInput.trim()],
            }));
            setImageInput('');
        }
    };

    const handleRemoveImage = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const handleAddTag = () => {
        if (tagInput.trim()) {
            setFormData((prev) => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()],
            }));
            setTagInput('');
        }
    };

    const handleRemoveTag = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((_, i) => i !== index),
        }));
    };

    return (
        <div className="grid gap-4 py-4">
            <div className="border-b pb-4">
                <h4 className="text-sm font-medium mb-3">Tax Templates</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="salesTaxTemplate">Sales Tax Template</Label>
                        <SearchableSelect
                            entityType="tax_templates"
                            value={formData.salesTaxTemplateId || ''}
                            onValueChange={(value) =>
                                setFormData((prev) => ({ ...prev, salesTaxTemplateId: value || null }))
                            }
                            listFetcher={async () => salesTaxTemplates}
                            labelFormatter={(template: TaxTemplate) =>
                                `${template.template_name} (${template.template_code})`
                            }
                            valueKey="id"
                            placeholder="Select sales tax template"
                            isLoading={isLoadingTaxTemplates}
                            items={salesTaxTemplates}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="purchaseTaxTemplate">Purchase Tax Template</Label>
                        <SearchableSelect
                            entityType="tax_templates"
                            value={formData.purchaseTaxTemplateId || ''}
                            onValueChange={(value) =>
                                setFormData((prev) => ({ ...prev, purchaseTaxTemplateId: value || null }))
                            }
                            listFetcher={async () => purchaseTaxTemplates}
                            labelFormatter={(template: TaxTemplate) =>
                                `${template.template_name} (${template.template_code})`
                            }
                            valueKey="id"
                            placeholder="Select purchase tax template"
                            isLoading={isLoadingTaxTemplates}
                            items={purchaseTaxTemplates}
                        />
                    </div>
                </div>
            </div>

            <div className="border-b pb-4">
                <h4 className="text-sm font-medium mb-3">Product Identification</h4>
                <div className="grid grid-cols-2 gap-4">
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

            <div className="border-b pb-4">
                <h4 className="text-sm font-medium mb-3">Additional Images</h4>
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

            <div className="border-b pb-4">
                <h4 className="text-sm font-medium mb-3">Tags</h4>
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

            <div>
                <h4 className="text-sm font-medium mb-3">Custom Fields (JSON)</h4>
                <Textarea
                    value={JSON.stringify(formData.customFields, null, 2)}
                    onChange={(e) => {
                        try {
                            const parsed = JSON.parse(e.target.value);
                            setFormData((prev) => ({ ...prev, customFields: parsed }));
                        } catch {
                            // Invalid JSON, don't update
                        }
                    }}
                    placeholder='{"key": "value"}'
                    rows={4}
                />
            </div>
        </div>
    );
}
