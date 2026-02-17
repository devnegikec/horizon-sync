import * as React from 'react';
import { Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@horizon-sync/ui/components/ui/dialog';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { cn } from '@horizon-sync/ui/lib';
import type { ApiItemGroup } from '../../../types/item-groups.types';
import type { TaxTemplate } from '../../../types/tax-template.types';
import type { ItemFormData } from '../../../utility/item-payload-builders';
import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2PricingStock } from './Step2PricingStock';
import { Step3TaxAdditional } from './Step3TaxAdditional';

interface ItemMultiStepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemGroups: ApiItemGroup[];
  salesTaxTemplates?: TaxTemplate[];
  purchaseTaxTemplates?: TaxTemplate[];
  isLoadingTaxTemplates?: boolean;
  onSave: (data: ItemFormData) => Promise<void>;
  initialData?: Partial<ItemFormData>;
}

const STEPS = [
  { id: 1, title: 'Basic Info', description: 'Essential details' },
  { id: 2, title: 'Pricing & Stock', description: 'Rates and inventory' },
  { id: 3, title: 'Tax & Additional', description: 'Tax and custom fields' },
];

const getInitialFormData = (initialData?: Partial<ItemFormData>): ItemFormData => ({
  itemCode: '',
  name: '',
  description: '',
  itemGroupId: '',
  itemType: 'product',
  unitOfMeasure: 'unit',
  status: 'active',
  defaultPrice: '',
  valuationRate: '',
  maintainStock: true,
  allowNegativeStock: false,
  valuationMethod: 'FIFO',
  barcode: '',
  imageUrl: '',
  salesTaxTemplateId: null,
  purchaseTaxTemplateId: null,
  customFields: {},
  hasVariants: false,
  variantOf: null,
  variantAttributes: {},
  hasBatchNo: false,
  batchNumberSeries: '',
  hasSerialNo: false,
  serialNumberSeries: '',
  weightPerUnit: '',
  weightUom: '',
  enableAutoReorder: false,
  reorderLevel: 0,
  reorderQty: 0,
  minOrderQty: 1,
  maxOrderQty: 1,
  inspectionRequiredBeforePurchase: false,
  inspectionRequiredBeforeDelivery: false,
  qualityInspectionTemplate: null,
  images: [],
  tags: [],
  extraData: {},
  ...initialData,
});

export function ItemMultiStepDialog({
  open,
  onOpenChange,
  itemGroups,
  salesTaxTemplates = [],
  purchaseTaxTemplates = [],
  isLoadingTaxTemplates = false,
  onSave,
  initialData,
}: ItemMultiStepDialogProps) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [formData, setFormData] = React.useState<ItemFormData>(() => getInitialFormData(initialData));
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setFormData(getInitialFormData(initialData));
      setIsSubmitting(false);
    }
  }, [open, initialData]);

  const updateFormData = React.useCallback((updates: Partial<ItemFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.itemCode &&
          formData.name &&
          formData.itemGroupId &&
          formData.itemType &&
          formData.unitOfMeasure &&
          formData.status
        );
      case 2:
        return !!formData.defaultPrice;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const isStepComplete = (stepId: number) => stepId < currentStep;
  const isStepCurrent = (stepId: number) => stepId === currentStep;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Item</DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-between px-4 py-6 border-b">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                    isStepComplete(step.id) && 'border-primary bg-primary text-primary-foreground',
                    isStepCurrent(step.id) && 'border-primary bg-background text-primary',
                    !isStepComplete(step.id) && !isStepCurrent(step.id) && 'border-muted-foreground/30 bg-background text-muted-foreground'
                  )}
                >
                  {isStepComplete(step.id) ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className={cn(
                    'text-sm font-medium',
                    isStepCurrent(step.id) ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-[2px] flex-1 mx-2 transition-all',
                    isStepComplete(step.id + 1) ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {currentStep === 1 && (
            <Step1BasicInfo
              formData={formData}
              onUpdate={updateFormData}
              itemGroups={itemGroups}
            />
          )}
          {currentStep === 2 && (
            <Step2PricingStock
              formData={formData}
              onUpdate={updateFormData}
            />
          )}
          {currentStep === 3 && (
            <Step3TaxAdditional
              formData={formData}
              onUpdate={updateFormData}
              salesTaxTemplates={salesTaxTemplates}
              purchaseTaxTemplates={purchaseTaxTemplates}
              isLoadingTaxTemplates={isLoadingTaxTemplates}
            />
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isSubmitting}
                >
                  Previous
                </Button>
              )}
              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!validateStep(currentStep)}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!validateStep(currentStep) || isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Item'}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
