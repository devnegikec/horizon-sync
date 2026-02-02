import { Loader2 } from 'lucide-react';
import { FieldErrors, UseFormRegister } from 'react-hook-form';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';

import { useRegistrationForm } from '../../hooks/useRegistrationForm';
import { RegisterFormData } from '../../utility/validationSchema';

import { RegistrationFooter } from './RegistrationFooter';
import { RegistrationFormInput } from './RegistrationFormInput';
import { RegistrationHeader } from './RegistrationHeader';

type RegistrationFormProps = {
  register: ReturnType<typeof useRegistrationForm>['register'];
  handleSubmit: ReturnType<typeof useRegistrationForm>['handleSubmit'];
  errors: ReturnType<typeof useRegistrationForm>['errors'];
  isSubmitting: boolean;
};

function RegistrationFormBody({ register, handleSubmit, errors, isSubmitting }: RegistrationFormProps) {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <RegistrationFormInput id="email"
        label="Email"
        type="email"
        placeholder="john.doe@example.com"
        registration={register('email')}
        error={errors.email}
        testId="registration-email"/>
      <div className="grid grid-cols-2 gap-4">
        <RegistrationFormInput id="first_name"
          label="First Name"
          placeholder="John"
          registration={register('first_name')}
          error={errors.first_name}
          testId="registration-first-name"/>
        <RegistrationFormInput id="last_name"
          label="Last Name"
          placeholder="Doe"
          registration={register('last_name')}
          error={errors.last_name}
          testId="registration-last-name"/>
      </div>
      <FormFieldsGroup register={register} errors={errors} />
      <Button type="submit"
        className="w-full bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white shadow-lg shadow-[#3058EE]/25"
        disabled={isSubmitting}
        data-testid="registration-submit-button">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </Button>
    </form>
  );
}

export function RegistrationForm() {
  const { register, handleSubmit, errors, isSubmitting } = useRegistrationForm();
  return (
    <Card className="w-full max-w-md border-none shadow-2xl">
      <RegistrationHeader />
      <CardContent>
        <RegistrationFormBody register={register} handleSubmit={handleSubmit} errors={errors} isSubmitting={isSubmitting} />
      </CardContent>
      <RegistrationFooter />
    </Card>
  );
}

interface FormFieldsGroupProps {
  register: UseFormRegister<RegisterFormData>;
  errors: FieldErrors<RegisterFormData>;
}

function FormFieldsGroup({ register, errors }: FormFieldsGroupProps) {
  return (
    <>
      <RegistrationFormInput id="phone"
        label="Phone"
        placeholder="9008750493"
        registration={register('phone')}
        error={errors.phone}
        testId="registration-phone"/>
      <RegistrationFormInput id="password"
        label="Password"
        type="password"
        placeholder="••••••••"
        registration={register('password')}
        error={errors.password}
        testId="registration-password"/>
      <RegistrationFormInput id="confirm_password"
        label="Confirm Password"
        type="password"
        placeholder="••••••••"
        registration={register('confirm_password')}
        error={errors.confirm_password}
        testId="registration-confirm-password"/>
    </>
  );
}
