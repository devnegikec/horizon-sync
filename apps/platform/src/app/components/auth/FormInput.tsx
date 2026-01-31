import { UseFormRegisterReturn } from 'react-hook-form';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  register?: UseFormRegisterReturn;
  error?: string;
}

export function FormInput({ label, register, error, ...props }: FormInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>{label} <span className="text-destructive">*</span></Label>
      <Input {...props} {...register} className={error ? 'border-destructive' : ''} />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
