import * as React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import type { User } from '@horizon-sync/store';

import { UserService } from '../services/user.service';

import { useAuth } from './useAuth';
import { useOnboardingStore, type OnboardingData } from './useOnboardingStore';

export const personalDetailsSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: z.string().optional(),
  jobTitle: z.string().min(1, 'Job title is required'),
  department: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  timezone: z.string().min(1, 'Timezone is required'),
});

export type PersonalDetailsFormData = z.infer<typeof personalDetailsSchema>;

// eslint-disable-next-line complexity
const getInitialValues = (data: OnboardingData, user: User | null) => ({
  firstName: data.firstName || user?.first_name || '',
  lastName: data.lastName || user?.last_name || '',
  phoneNumber: data.phoneNumber || user?.phone || '',
  jobTitle: data.jobTitle || user?.job_title || '',
  department: data.department || user?.department || '',
  bio: data.bio || user?.bio || '',
  timezone: data.timezone || user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  avatarUrl: data.avatarUrl || user?.avatar_url || '',
});

export function usePersonalDetailsForm() {
  const { user, accessToken } = useAuth();
  const { data, updateData, setCurrentStep } = useOnboardingStore();

  const defaults = React.useMemo(() => getInitialValues(data, user), [data, user]);
  const [avatarPreview, setAvatarPreview] = React.useState(defaults.avatarUrl);

  const form = useForm<PersonalDetailsFormData>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: defaults,
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      updateData({ avatarUrl: result });
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (formData: PersonalDetailsFormData) => {
    try {
      if (accessToken) {
        await UserService.updateMe(
          {
            first_name: formData.firstName,
            last_name: formData.lastName,
            display_name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phoneNumber,
            timezone: formData.timezone,
            avatar_url: avatarPreview,
            preferences: {
              onboarding_step: 2,
              theme: 'light',
            },
            extra_data: {
              job_title: formData.jobTitle,
              department: formData.department,
              bio: formData.bio,
            },
          },
          accessToken,
        );
      }
      updateData({ ...formData, avatarUrl: avatarPreview });
      setCurrentStep(2);
    } catch (error) {
      console.error('Failed to update personal details:', error);
    }
  };

  const [fName, lName] = form.watch(['firstName', 'lastName']);
  const initials = `${(fName || '').charAt(0)}${(lName || '').charAt(0)}`.toUpperCase();

  return {
    form,
    avatarPreview,
    initials,
    handleAvatarChange,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
  };
}
