import * as React from 'react';

import { FormDialog } from '../containers';

import { buildSavePayload, initFormData } from './customer.helpers';
import { CustomerFormFields } from './CustomerFormFields';
import type { CustomerDialogProps, CustomerFormData } from './types';

export function CustomerDialog({ open, onOpenChange, customer, onSave, saving = false }: CustomerDialogProps) {
  const isEdit = !!customer;
  const [formData, setFormData] = React.useState<CustomerFormData>(() => initFormData(customer));

  React.useEffect(() => {
    setFormData(initFormData(customer));
  }, [customer, open]);

  const handleFieldChange = (field: keyof CustomerFormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      <CustomerFormFields formData={formData} isEdit={isEdit} onFieldChange={handleFieldChange} />
    </FormDialog>
  );
}
