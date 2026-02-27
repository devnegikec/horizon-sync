import * as React from 'react';

import { Building2, CheckCircle2, Download, Upload } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';

import { StepSelectWarehouse } from './StepSelectWarehouse';
import { StepTemplateDownload } from './StepTemplateDownload';
import { StepUploadVerify } from './StepUploadVerify';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type WizardStep = 1 | 2 | 3;

export interface WizardState {
  selectedWarehouseId: string;
  selectedWarehouseName: string;
}

/* ------------------------------------------------------------------ */
/*  Step definitions                                                   */
/* ------------------------------------------------------------------ */

const STEPS = [
  { id: 1, label: 'Select Warehouse', icon: Building2 },
  { id: 2, label: 'Template Download', icon: Download },
  { id: 3, label: 'Upload & Verify', icon: Upload },
] as const;

/* ------------------------------------------------------------------ */
/*  Stepper header                                                     */
/* ------------------------------------------------------------------ */

function StepperHeader({ currentStep }: { currentStep: WizardStep }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;
        const Icon = step.icon;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className={[
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                  isCompleted
                    ? 'border-primary bg-primary text-primary-foreground'
                    : isActive
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted-foreground/30 bg-muted text-muted-foreground',
                ].join(' ')}>
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <span className={[
                  'text-xs font-medium text-center',
                  isActive ? 'text-primary' : isCompleted ? 'text-primary' : 'text-muted-foreground',
                ].join(' ')}>
                {step.label}
              </span>
            </div>

            {index < STEPS.length - 1 && (
              <div className={[
                  'h-0.5 flex-1 mx-2 mb-5 transition-all',
                  currentStep > step.id ? 'bg-primary' : 'bg-muted-foreground/20',
                ].join(' ')}/>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main wizard component                                              */
/* ------------------------------------------------------------------ */

interface ReconciliationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted?: () => void;
}

export function ReconciliationWizard({
  open,
  onOpenChange,
  onCompleted,
}: ReconciliationWizardProps) {
  const [currentStep, setCurrentStep] = React.useState<WizardStep>(1);
  const [wizardState, setWizardState] = React.useState<WizardState>({
    selectedWarehouseId: '',
    selectedWarehouseName: '',
  });

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setWizardState({ selectedWarehouseId: '', selectedWarehouseName: '' });
    }
  }, [open]);

  const handleWarehouseSelected = (id: string, name: string) => {
    setWizardState({ selectedWarehouseId: id, selectedWarehouseName: name });
  };

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep((s) => (s + 1) as WizardStep);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => (s - 1) as WizardStep);
  };

  const handleFinish = () => {
    onOpenChange(false);
    onCompleted?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Stock Reconciliation</DialogTitle>
        </DialogHeader>

        <StepperHeader currentStep={currentStep} />

        {currentStep === 1 && (
          <StepSelectWarehouse selectedWarehouseId={wizardState.selectedWarehouseId}
            onSelect={handleWarehouseSelected}
            onNext={handleNext}/>
        )}

        {currentStep === 2 && (
          <StepTemplateDownload warehouseName={wizardState.selectedWarehouseName}
            warehouseId={wizardState.selectedWarehouseId}
            onNext={handleNext}
            onBack={handleBack}/>
        )}

        {currentStep === 3 && (
          <StepUploadVerify warehouseName={wizardState.selectedWarehouseName}
            warehouseId={wizardState.selectedWarehouseId}
            onBack={handleBack}
            onFinish={handleFinish}/>
        )}
      </DialogContent>
    </Dialog>
  );
}
