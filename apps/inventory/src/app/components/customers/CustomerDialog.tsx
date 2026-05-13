import * as React from 'react';

import { customerFormSchema } from '../../utility/validation-schemas';
import { FormDialog } from '../containers';

import { buildSavePayload, initFormData } from './customer.helpers';
import { CustomerFormFields } from './CustomerFormFields';
import type { CustomerDialogProps, CustomerFormData } from './types';

export function CustomerDialog({ open, onOpenChange, customer, onSave, saving = false }: CustomerDialogProps) {
  const isEdit = !!customer;
  const [formData, setFormData] = React.useState<CustomerFormData>(() => initFormData(customer));
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    setFormData(initFormData(customer));
    setFieldErrors({});
  }, [customer, open]);

  const handleFieldChange = (field: keyof CustomerFormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    // Validate with Zod
    const validationData = {
      ...formData,
      credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : undefined,
      outstanding_balance: formData.outstanding_balance ? parseFloat(formData.outstanding_balance) : undefined,
    };

    const result = customerFormSchema.safeParse(validationData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!errors[path]) errors[path] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    onSave(buildSavePayload(formData));
  };

  return (
    <FormDialog open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Customer' : 'Add New Customer'}
      size="lg"
      onSubmit={handleSubmit}
      submitLabel={isEdit ? 'Update Customer' : 'Create Customer'}
      saving={saving}>
      <CustomerFormFields formData={formData} isEdit={isEdit} onFieldChange={handleFieldChange} fieldErrors={fieldErrors} />
    </FormDialog>
  );
}
