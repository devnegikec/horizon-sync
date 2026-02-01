import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { useAuth } from "@platform/app/hooks";

import { useOnboardingStore } from "./useOnboardingStore";

export const personalDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().optional(),
  jobTitle: z.string().min(1, "Job title is required"),
  department: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  timezone: z.string().min(1, "Timezone is required"),
});

export type PersonalDetailsFormData = z.infer<typeof personalDetailsSchema>;

const getInitialValues = (user: any) => ({
  firstName: user.first_name,
  lastName: user.last_name,
  phoneNumber: user.phone,
  jobTitle: user?.job_title,
  department: user?.department || "",
  bio: user?.bio || "",
  timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  avatarUrl: user?.avatar_url,
});

export function usePersonalDetailsForm() {
  const { user } = useAuth();
  const { updateData, setCurrentStep } = useOnboardingStore();

  const defaults = React.useMemo(() => getInitialValues(user), [user]);
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

  const onSubmit = (formData: PersonalDetailsFormData) => {
    updateData({ ...formData, avatarUrl: avatarPreview });
    setCurrentStep(2);
  };

  const [fName, lName] = form.watch(["firstName", "lastName"]);
  const initials = `${(fName || "").charAt(0)}${(lName || "").charAt(0)}`.toUpperCase();

  return {
    form,
    avatarPreview,
    initials,
    handleAvatarChange,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
  };
}
