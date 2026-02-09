import * as React from 'react';

import { Phone } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';

import { usePersonalDetailsForm } from '../../hooks/usePersonalDetailsForm';

import { AdditionalDetailsFields } from './AdditionalDetailsFields';
import { AvatarUpload } from './AvatarUpload';
import { NameFields } from './NameFields';

export function PersonalDetailsStep() {
  const {
    form: {
      register,
      setValue,
      watch,
      formState: { errors },
    },
    avatarPreview,
    initials,
    handleAvatarChange,
    onSubmit,
    isSubmitting,
  } = usePersonalDetailsForm();

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <AvatarUpload avatarPreview={avatarPreview} initials={initials} onAvatarChange={handleAvatarChange} />

      <NameFields register={register} errors={errors} />

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="phoneNumber" type="tel" placeholder="+1 (555) 123-4567" {...register('phoneNumber')} className="pl-10" />
        </div>
      </div>

      {/* <JobDetailsFields register={register} errors={errors} setValue={setValue} watch={watch} /> */}

      <AdditionalDetailsFields register={register} errors={errors} setValue={setValue} watch={watch} />

      <Button type="submit"
        className="w-full bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white shadow-lg shadow-[#3058EE]/25"
        disabled={isSubmitting}>
        Continue to Organization Setup
      </Button>
    </form>
  );
}
