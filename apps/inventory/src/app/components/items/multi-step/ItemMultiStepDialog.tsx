import * as React from 'react';

import { Check } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@horizon-sync/ui/components/ui/dialog';
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
  accessToken: string;
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

function validateStep(step: number, formData: ItemFormData): boolean {
  switch (step) {
    case 1:
      return !!(
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
}

const getInitialFormData = (initialData?: Partial<ItemFormData>): ItemFormData => ({
  itemCode: '',
  name: '',
  description: '',
  itemGroupId: '',
  itemType: 'stock',
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

function DialogFooterButtons({
  currentStep,
  isSubmitting,
  isValid,
  onCancel,
  onPrevious,
  onNext,
  onSubmit,
}: {
  currentStep: number;
  isSubmitting: boolean;
  isValid: boolean;
  onCancel: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex items-center justify-between w-full">
      <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      <div className="flex gap-2">
        {currentStep > 1 && (
          <Button type="button" variant="outline" onClick={onPrevious} disabled={isSubmitting}>
            Previous
          </Button>
        )}
        {currentStep < STEPS.length ? (
          <Button type="button" onClick={onNext} disabled={!isValid}>Next</Button>
        ) : (
          <Button type="button" onClick={onSubmit} disabled={!isValid || isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Item'}
          </Button>
        )}
      </div>
    </div>
  );
}

function StepMarker({ stepId, isComplete, isCurrent }: { stepId: number; isComplete: boolean; isCurrent: boolean }) {
  return (
    <div className={cn(
      'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
      isComplete && 'border-primary bg-primary text-primary-foreground',
      isCurrent && 'border-primary bg-background text-primary',
      !isComplete && !isCurrent && 'border-muted-foreground/30 bg-background text-muted-foreground'
    )}>
      {isComplete ? (
        <Check className="h-5 w-5" />
      ) : (
        <span className="text-sm font-semibold">{stepId}</span>
      )}
    </div>
  );
}

export function ItemMultiStepDialog({
  open,
  onOpenChange,
  itemGroups,
  accessToken,
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

  const handleNext = () => {
    if (validateStep(currentStep, formData)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3, formData)) return;

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
                <StepMarker stepId={step.id}
                  isComplete={isStepComplete(step.id)}
                  isCurrent={isStepCurrent(step.id)}/>
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
                <div className={cn(
                    'h-[2px] flex-1 mx-2 transition-all',
                    isStepComplete(step.id + 1) ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}/>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {currentStep === 1 && (
            <Step1BasicInfo formData={formData}
              onUpdate={updateFormData}
              itemGroups={itemGroups}
              accessToken={accessToken}/>
          )}
          {currentStep === 2 && (
            <Step2PricingStock formData={formData}
              onUpdate={updateFormData}/>
          )}
          {currentStep === 3 && (
            <Step3TaxAdditional formData={formData}
              onUpdate={updateFormData}
              salesTaxTemplates={salesTaxTemplates}
              purchaseTaxTemplates={purchaseTaxTemplates}
              isLoadingTaxTemplates={isLoadingTaxTemplates}/>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t pt-4">
          <DialogFooterButtons currentStep={currentStep}
            isSubmitting={isSubmitting}
            isValid={validateStep(currentStep, formData)}
            onCancel={handleCancel}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSubmit={handleSubmit}/>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
