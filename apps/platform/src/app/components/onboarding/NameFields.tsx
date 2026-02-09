'use client';

import * as React from 'react';

import { User as UserIcon } from 'lucide-react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';

import { PersonalDetailsFormData } from '../../hooks/usePersonalDetailsForm';

interface NameFieldsProps {
  register: UseFormRegister<PersonalDetailsFormData>;
  errors: FieldErrors<PersonalDetailsFormData>;
}

export function NameFields({ register, errors }: NameFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="firstName">
          First Name <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="firstName" placeholder="John" {...register('firstName')} className={`pl-10 ${errors.firstName ? 'border-destructive' : ''}`} />
        </div>
        {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName">
          Last Name <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="lastName" placeholder="Doe" {...register('lastName')} className={`pl-10 ${errors.lastName ? 'border-destructive' : ''}`} />
        </div>
        {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
      </div>
    </div>
  );
}
