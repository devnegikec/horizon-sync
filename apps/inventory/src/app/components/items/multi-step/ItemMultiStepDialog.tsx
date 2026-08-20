import * as React from 'react';

import { Check } from 'lucide-react';

import { DetailDialog } from '@horizon-sync/ui/components';
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
  accessToken: string;
  salesTaxTemplates?: TaxTemplate[];
  purchaseTaxTemplates?: TaxTemplate[];
  isLoadingTaxTemplates?: boolean;
  onSave: (data: ItemFormData) => Promise<void>;
  initialData?: Partial<ItemFormData>;
  isEditing?: boolean;
}

const STEPS = [
  { id: 1, title: 'Basic Info', description: 'Essential details' },
  { id: 2, title: 'Pricing & Stock', description: 'Rates and inventory' },
  { id: 3, title: 'Tax & Additional', description: 'Tax and custom fields' },
];

const SKU_PATTERN = /^[a-zA-Z0-9-]*$/;

function isSkuValid(sku: string): boolean {
  return !sku || (sku.length <= 100 && SKU_PATTERN.test(sku));
}

// eslint-disable-next-line complexity
function isStep1Valid(formData: ItemFormData): boolean {
  if (!formData.name?.trim() || formData.name.length > 255) return false;
  if (formData.description && formData.description.length > 1000) return false;
  if (!isSkuValid(formData.sku)) return false;
  if (!formData.itemGroupId?.trim()) return false;
  if (!formData.itemType?.trim()) return false;
  if (!formData.unitOfMeasure?.trim()) return false;
  if (!formData.status?.trim()) return false;
  return true;
}

function validateStep(step: number, formData: ItemFormData): boolean {
  switch (step) {
    case 1:
      return isStep1Valid(formData);
    case 2: {
      if (!formData.defaultPrice) return false;
      // Cross-field validation: min_order_qty must be <= max_order_qty (when max > 0)
      if (formData.maxOrderQty > 0 && formData.minOrderQty > formData.maxOrderQty) {
        return false;
      }
      return true;
    }
    case 3:
      return true;
    default:
      return false;
  }
}

const getInitialFormData = (initialData?: Partial<ItemFormData>): ItemFormData => ({
  itemCode: '',
  name: '',
  brandId: '',
  gtin: '',
  industry: '',
  landingPage: '',
  warrantyPeriodMonths: '',
  qrType: '',
  activationMethod: 'pre',
  srNumberType: '',
  sku: '',
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
  maxOrderQty: 0,
  inspectionRequiredBeforePurchase: false,
  inspectionRequiredBeforeDelivery: false,
  qualityInspectionTemplate: null,
  images: [],
  tags: [],
  extraData: {},
  packagingUnitName: 'Each',
  packagingConversionFactor: '1',
  packagingItemsPerMasterPack: '',
  packagingLengthMm: '',
  packagingWidthMm: '',
  packagingHeightMm: '',
  packagingWeightGrams: '',
  ...initialData,
});

function DialogFooterButtons({
  currentStep,
  isSubmitting,
  isValid,
  isEditing,
  onCancel,
  onPrevious,
  onNext,
  onSubmit,
}: {
  currentStep: number;
  isSubmitting: boolean;
  isValid: boolean;
  isEditing: boolean;
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
            {isSubmitting ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Item')}
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
  isEditing = false,
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
    // Only reset when the dialog opens, not on every parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
    <DetailDialog
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      contentClassName="max-w-4xl flex flex-col"
      style={{ height: 'min(85vh, 820px)' }}
      title={isEditing ? 'Edit Item' : 'Create New Item'}
      showCloseButton={false}
      footer={
        <DialogFooterButtons currentStep={currentStep}
          isSubmitting={isSubmitting}
          isValid={validateStep(currentStep, formData)}
          isEditing={isEditing}
          onCancel={handleCancel}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSubmit={handleSubmit} />
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        {/* Stepper (fixed) */}
        <div className="flex items-center justify-between border-b pb-4 shrink-0">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-3">
                <StepMarker stepId={step.id}
                  isComplete={isStepComplete(step.id)}
                  isCurrent={isStepCurrent(step.id)} />
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
                )} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Content (scrollable) */}
        <div className="flex-1 min-h-0 overflow-y-auto py-4">
          {currentStep === 1 && (
            <Step1BasicInfo formData={formData}
              onUpdate={updateFormData}
              itemGroups={itemGroups}
              accessToken={accessToken} />
          )}
          {currentStep === 2 && (
            <Step2PricingStock formData={formData}
              onUpdate={updateFormData} />
          )}
          {currentStep === 3 && (
            <Step3TaxAdditional formData={formData}
              onUpdate={updateFormData}
              salesTaxTemplates={salesTaxTemplates}
              purchaseTaxTemplates={purchaseTaxTemplates}
              isLoadingTaxTemplates={isLoadingTaxTemplates} />
          )}
        </div>
      </div>
    </DetailDialog>
  );
}
