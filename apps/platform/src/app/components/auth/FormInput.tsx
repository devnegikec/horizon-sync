import { UseFormRegisterReturn } from 'react-hook-form';

import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  register?: UseFormRegisterReturn;
  error?: string;
  'data-testid'?: string;
}

export function FormInput({ label, register, error, 'data-testid': testId, ...props }: FormInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>
        {label} <span className="text-destructive">*</span>
      </Label>
      <Input {...props} {...register} className={error ? 'border-destructive' : ''} data-testid={testId} />
      {error && <p className="text-sm text-destructive" data-testid={testId ? `${testId}-error` : undefined}>{error}</p>}
    </div>
  );
}
