import * as React from 'react';

import { Briefcase, Building2 } from 'lucide-react';
import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';

import { PersonalDetailsFormData } from '../../hooks/usePersonalDetailsForm';

const departments = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Customer Success',
  'Human Resources',
  'Finance',
  'Operations',
  'Legal',
  'Other',
];

interface JobDetailsFieldsProps {
  register: UseFormRegister<PersonalDetailsFormData>;
  errors: FieldErrors<PersonalDetailsFormData>;
  setValue: UseFormSetValue<PersonalDetailsFormData>;
  watch: UseFormWatch<PersonalDetailsFormData>;
}

export function JobDetailsFields({ register, errors, setValue, watch }: JobDetailsFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="jobTitle">
          Job Title <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="jobTitle"
            placeholder="Product Manager"
            {...register('jobTitle')}
            className={`pl-10 ${errors.jobTitle ? 'border-destructive' : ''}`}/>
        </div>
        {errors.jobTitle && <p className="text-sm text-destructive">{errors.jobTitle.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <Select defaultValue={watch('department')} onValueChange={(value) => setValue('department', value)}>
          <SelectTrigger className="w-full">
            <div className="flex items-center">
              <Building2 className="h-4 w-4 text-muted-foreground mr-2" />
              <SelectValue placeholder="Select department" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
