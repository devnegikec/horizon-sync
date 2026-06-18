import * as React from 'react';

import { Loader2 } from 'lucide-react';
import { FieldErrors, UseFormClearErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components/ui/select';

import { useRegistrationForm } from '../../hooks/useRegistrationForm';
import { COUNTRIES, describeExpectedLength, getCountry, getDialCodeByCountry } from '../../utility/countries';
import { RegisterFormData } from '../../utility/validationSchema';

import { RegistrationFooter } from './RegistrationFooter';
import { RegistrationFormInput } from './RegistrationFormInput';
import { RegistrationHeader } from './RegistrationHeader';

type RegistrationFormProps = {
  register: ReturnType<typeof useRegistrationForm>['register'];
  handleSubmit: ReturnType<typeof useRegistrationForm>['handleSubmit'];
  errors: ReturnType<typeof useRegistrationForm>['errors'];
  setValue: ReturnType<typeof useRegistrationForm>['setValue'];
  watch: ReturnType<typeof useRegistrationForm>['watch'];
  clearErrors: ReturnType<typeof useRegistrationForm>['clearErrors'];
  isSubmitting: boolean;
};

function RegistrationFormBody({ register, handleSubmit, errors, setValue, watch, clearErrors, isSubmitting }: RegistrationFormProps) {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <RegistrationFormInput id="email"
        label="Email"
        type="email"
        placeholder="john.doe@example.com"
        registration={register('email')}
        error={errors.email}
        testId="registration-email" />
      <div className="grid grid-cols-2 gap-4">
        <RegistrationFormInput id="first_name"
          label="First Name"
          placeholder="John"
          registration={register('first_name')}
          error={errors.first_name}
          testId="registration-first-name" />
        <RegistrationFormInput id="last_name"
          label="Last Name"
          placeholder="Doe"
          registration={register('last_name')}
          error={errors.last_name}
          testId="registration-last-name" />
      </div>
      <FormFieldsGroup register={register} errors={errors} setValue={setValue} watch={watch} clearErrors={clearErrors} />
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
  const { register, handleSubmit, errors, setValue, watch, clearErrors, isSubmitting } = useRegistrationForm();
  return (
    <Card className="w-full max-w-md border-none shadow-2xl">
      <RegistrationHeader />
      <CardContent>
        <RegistrationFormBody register={register} handleSubmit={handleSubmit} errors={errors} setValue={setValue} watch={watch} clearErrors={clearErrors} isSubmitting={isSubmitting} />
      </CardContent>
      <RegistrationFooter />
    </Card>
  );
}

interface FormFieldsGroupProps {
  register: UseFormRegister<RegisterFormData>;
  errors: FieldErrors<RegisterFormData>;
  setValue: UseFormSetValue<RegisterFormData>;
  watch: UseFormWatch<RegisterFormData>;
  clearErrors: UseFormClearErrors<RegisterFormData>;
}

function CountryAndPhoneFields({ register, errors, setValue, watch, clearErrors }: FormFieldsGroupProps) {
  const selectedCountry = watch('country');
  const dialCode = watch('phone_country_code');
  const country = selectedCountry ? getCountry(selectedCountry) : undefined;
  const maxPhoneLen = country
    ? Math.max(...(Array.isArray(country.phoneLength) ? country.phoneLength : [country.phoneLength]))
    : 15;

  const handleCountryChange = (code: string) => {
    setValue('country', code, { shouldValidate: true });
    const next = getDialCodeByCountry(code);
    if (next) setValue('phone_country_code', next, { shouldValidate: true });
    // Only update the phone value so the placeholder hint changes; do NOT
    // force validation here — validation runs only on submit.
    setValue('phone', watch('phone') ?? '', { shouldValidate: false });
  };

  // Strip non-digits and clamp to country-specific max length so the field
  // can never accept invalid input in the first place.
  const phoneRegistration = register('phone', {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const cleaned = e.target.value.replace(/\D/g, '').slice(0, maxPhoneLen);
      if (cleaned !== e.target.value) {
        setValue('phone', cleaned, { shouldValidate: false });
      }
      // Clear any existing phone error as soon as the user starts typing.
      clearErrors('phone');
    },
  });

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="country">
          Country <span className="text-destructive">*</span>
        </Label>
        <Select value={selectedCountry || ''} onValueChange={handleCountryChange}>
          <SelectTrigger
            id="country"
            className={errors.country ? 'border-destructive' : ''}
            data-testid="registration-country"
          >
            <SelectValue placeholder="Select your country" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.name} ({c.dialCode})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">
          Contact Number <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <div className="flex h-9 min-w-[72px] items-center justify-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
            {dialCode || '+--'}
          </div>
          <Input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={maxPhoneLen}
            placeholder={country ? `Enter ${describeExpectedLength(country)}` : 'Select country first'}
            disabled={!country}
            {...phoneRegistration}
            className={errors.phone ? 'border-destructive flex-1' : 'flex-1'}
            data-testid="registration-phone"
          />
        </div>
        {errors.phone || errors.phone_country_code ? (
          <p className="text-sm text-destructive">
            {errors.phone?.message || errors.phone_country_code?.message}
          </p>
        ) : country ? (
          <p className="text-xs text-muted-foreground">
            Expected: {describeExpectedLength(country)} (no country code)
          </p>
        ) : null}
      </div>
    </>
  );
}

function FormFieldsGroup({ register, errors, setValue, watch, clearErrors }: FormFieldsGroupProps) {
  return (
    <>
      <CountryAndPhoneFields register={register} errors={errors} setValue={setValue} watch={watch} clearErrors={clearErrors} />
      <RegistrationFormInput id="password"
        label="Password"
        type="password"
        placeholder="••••••••"
        registration={register('password')}
        error={errors.password}
        testId="registration-password" />
      <RegistrationFormInput id="confirm_password"
        label="Confirm Password"
        type="password"
        placeholder="••••••••"
        registration={register('confirm_password')}
        error={errors.confirm_password}
        testId="registration-confirm-password" />
    </>
  );
}
