import * as React from 'react';

import { ArrowLeft, ArrowRight } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';

import type { CreateItemGroupResponse } from '../../types/item-group-creation.types';
import type { ApiItemGroup } from '../../types/item-groups.types';
import type { TaxTemplate } from '../../types/tax-template.types';
import type { ItemFormData } from '../../utility/item-payload-builders';

import { CreateItemGroupModal } from './CreateItemGroupModal';
import { MultiStepFormProvider, useMultiStepForm } from './MultiStepFormContext';
import { MultiStepFormHeader } from './MultiStepFormHeader';
import { Step1BasicInventory } from './steps/Step1BasicInventory';
import { Step2PricingOrdering } from './steps/Step2PricingOrdering';
import { Step3TaxAdditional } from './steps/Step3TaxAdditional';

interface ItemFormFieldsProps {
  formData: ItemFormData & { itemGroupName: string };
  setFormData: React.Dispatch<React.SetStateAction<ItemFormData & { itemGroupName: string }>>;
  itemGroups: ApiItemGroup[];
  onItemGroupsRefresh?: () => void;
  isLoading: boolean;
  salesTaxTemplates: TaxTemplate[];
  purchaseTaxTemplates: TaxTemplate[];
  isLoadingTaxTemplates: boolean;
}

function ItemFormContent({
  formData,
  setFormData,
  itemGroups,
  onItemGroupsRefresh,
  isLoading,
  salesTaxTemplates,
  purchaseTaxTemplates,
  isLoadingTaxTemplates,
}: ItemFormFieldsProps) {
  const { currentStep, nextStep, previousStep, isFirstStep, isLastStep } = useMultiStepForm();
  const [createGroupModalOpen, setCreateGroupModalOpen] = React.useState(false);

  const handleItemGroupCreated = React.useCallback((newItemGroup: CreateItemGroupResponse) => {
    setFormData((prev) => ({
      ...prev,
      itemGroupId: newItemGroup.id,
      itemGroupName: newItemGroup.name,
    }));
    onItemGroupsRefresh?.();
  }, [setFormData, onItemGroupsRefresh]);

  const currentStepComponent = React.useMemo(() => {
    switch (currentStep) {
      case 1:
        return (
          <Step1BasicInventory formData={formData}
            setFormData={setFormData}
            itemGroups={itemGroups}/>
        );
      case 2:
        return <Step2PricingOrdering formData={formData} setFormData={setFormData} />;
      case 3:
        return (
          <Step3TaxAdditional formData={formData}
            setFormData={setFormData}
            salesTaxTemplates={salesTaxTemplates}
            purchaseTaxTemplates={purchaseTaxTemplates}
            isLoadingTaxTemplates={isLoadingTaxTemplates}/>
        );
      default:
        return null;
    }
  }, [currentStep, formData, setFormData, itemGroups, salesTaxTemplates, purchaseTaxTemplates, isLoadingTaxTemplates]);

  return (
    <>
      <MultiStepFormHeader />

      <div className="min-h-[400px]">{currentStepComponent}</div>

      <div className="flex justify-between pt-6 border-t mt-4">
        <Button type="button"
          variant="outline"
          onClick={previousStep}
          disabled={isFirstStep}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {!isLastStep ? (
          <Button type="button" onClick={nextStep}>
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Item'}
          </Button>
        )}
      </div>

      <CreateItemGroupModal open={createGroupModalOpen}
        onOpenChange={setCreateGroupModalOpen}
        onItemGroupCreated={handleItemGroupCreated}/>
    </>
  );
}

export function ItemFormFields(props: Omit<ItemFormFieldsProps, 'salesTaxTemplates' | 'purchaseTaxTemplates' | 'isLoadingTaxTemplates'> & {
  salesTaxTemplates?: TaxTemplate[];
  purchaseTaxTemplates?: TaxTemplate[];
  isLoadingTaxTemplates?: boolean;
}) {
  return (
    <MultiStepFormProvider totalSteps={3}>
      <ItemFormContent {...props}
        salesTaxTemplates={props.salesTaxTemplates || []}
        purchaseTaxTemplates={props.purchaseTaxTemplates || []}
        isLoadingTaxTemplates={props.isLoadingTaxTemplates || false}/>
    </MultiStepFormProvider>
  );
}
