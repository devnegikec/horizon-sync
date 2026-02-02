import { FieldError, UseFormRegisterReturn } from 'react-hook-form';

import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';

interface FormInputFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  testId?: string;
  required?: boolean;
}

export function RegistrationFormInput({ id, label, type = 'text', placeholder, registration, error, testId, required = true }: FormInputFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input id={id} type={type} placeholder={placeholder} {...registration} className={error ? 'border-destructive' : ''} data-testid={testId} />
      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
}
