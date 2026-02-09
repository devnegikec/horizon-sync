import * as React from 'react';

import { Globe, FileText } from 'lucide-react';
import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import { PersonalDetailsFormData } from '../../hooks/usePersonalDetailsForm';

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
];

interface AdditionalDetailsFieldsProps {
  register: UseFormRegister<PersonalDetailsFormData>;
  errors: FieldErrors<PersonalDetailsFormData>;
  setValue: UseFormSetValue<PersonalDetailsFormData>;
  watch: UseFormWatch<PersonalDetailsFormData>;
}

export function AdditionalDetailsFields({ register, errors, setValue, watch }: AdditionalDetailsFieldsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="timezone">
          Timezone <span className="text-destructive">*</span>
        </Label>
        <Select defaultValue={watch('timezone')} onValueChange={(value) => setValue('timezone', value)}>
          <SelectTrigger className="w-full">
            <div className="flex items-center">
              <Globe className="h-4 w-4 text-muted-foreground mr-2" />
              <SelectValue placeholder="Select timezone" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {timezones.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.timezone && <p className="text-sm text-destructive">{errors.timezone.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Textarea id="bio" placeholder="Tell us a little about yourself..." {...register('bio')} className="pl-10 min-h-[100px] resize-none" />
        </div>
        <p className="text-xs text-muted-foreground text-right">{watch('bio')?.length || 0}/500 characters</p>
      </div>
    </div>
  );
}
