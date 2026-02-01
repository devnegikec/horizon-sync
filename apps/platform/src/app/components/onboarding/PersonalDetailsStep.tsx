"use client"

import * as React from "react"

import { zodResolver } from '@hookform/resolvers/zod';
import { User, Phone, Briefcase, Building2, FileText, Globe, Camera } from "lucide-react";
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Avatar, AvatarFallback, AvatarImage } from '@horizon-sync/ui/components/ui/avatar';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

// import { useOnboarding } from "@/lib/onboarding-context"
// import { Avatar, AvatarFallback, AvatarImage } fr
import { useAuth } from "@platform/app/hooks";

const personalDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().optional(),
  jobTitle: z.string().min(1, "Job title is required"),
  department: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  timezone: z.string().min(1, "Timezone is required"),
})

type PersonalDetailsFormData = z.infer<typeof personalDetailsSchema>

const timezones = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Asia/Shanghai", label: "China Standard Time (CST)" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
]

const departments = [
  "Engineering",
  "Product",
  "Design",
  "Marketing",
  "Sales",
  "Customer Success",
  "Human Resources",
  "Finance",
  "Operations",
  "Legal",
  "Other",
]

export function PersonalDetailsStep() {
  const { user } = useAuth()
  // const { data, updateData, setCurrentStep } = useOnboarding()
  const [avatarPreview, setAvatarPreview] = React.useState<string>(data.avatarUrl || "")

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PersonalDetailsFormData>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      firstName: user?.first_name || "",
      lastName: user?.last_name,
      phoneNumber: user.phone,
      jobTitle: user.jobTitle,
      department: user.department,
      bio: user.bio,
      timezone: user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setAvatarPreview(result)
        updateData({ avatarUrl: result })
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = (formData: PersonalDetailsFormData) => {
    updateData({
      ...formData,
      avatarUrl: avatarPreview,
    })
    setCurrentStep(2)
  }

  const firstName = watch("firstName") || ""
  const lastName = watch("lastName") || ""
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar Upload */}
      <div className="flex flex-col items-center gap-4 pb-4">
        <div className="relative group">
          <Avatar className="h-24 w-24 border-2 border-border">
            <AvatarImage src={avatarPreview || "/placeholder.svg"} alt="Profile" />
            <AvatarFallback className="text-xl bg-gradient-to-br from-[#3058EE] to-[#7D97F6] text-primary-foreground">
              {initials || <User className="h-8 w-8" />}
            </AvatarFallback>
          </Avatar>
          <label
            htmlFor="avatar-upload"
            className="absolute inset-0 flex items-center justify-center bg-foreground/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <Camera className="h-6 w-6 text-background" />
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="sr-only"
          />
        </div>
        <p className="text-sm text-muted-foreground">Click to upload profile picture</p>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">
            First Name <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="firstName"
              placeholder="John"
              {...register("firstName")}
              className={`pl-10 ${errors.firstName ? "border-destructive" : ""}`}
            />
          </div>
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">
            Last Name <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="lastName"
              placeholder="Doe"
              {...register("lastName")}
              className={`pl-10 ${errors.lastName ? "border-destructive" : ""}`}
            />
          </div>
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* Phone Number */}
      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="+1 (555) 123-4567"
            {...register("phoneNumber")}
            className="pl-10"
          />
        </div>
      </div>

      {/* Job Title & Department */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="jobTitle">
            Job Title <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="jobTitle"
              placeholder="Product Manager"
              {...register("jobTitle")}
              className={`pl-10 ${errors.jobTitle ? "border-destructive" : ""}`}
            />
          </div>
          {errors.jobTitle && (
            <p className="text-sm text-destructive">{errors.jobTitle.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Select
            defaultValue={data.department}
            onValueChange={(value) => setValue("department", value)}
          >
            <SelectTrigger className="w-full">
              <Building2 className="h-4 w-4 text-muted-foreground mr-2" />
              <SelectValue placeholder="Select department" />
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

      {/* Timezone */}
      <div className="space-y-2">
        <Label htmlFor="timezone">
          Timezone <span className="text-destructive">*</span>
        </Label>
        <Select
          defaultValue={data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
          onValueChange={(value) => setValue("timezone", value)}
        >
          <SelectTrigger className="w-full">
            <Globe className="h-4 w-4 text-muted-foreground mr-2" />
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {timezones.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.timezone && (
          <p className="text-sm text-destructive">{errors.timezone.message}</p>
        )}
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Textarea
            id="bio"
            placeholder="Tell us a little about yourself..."
            {...register("bio")}
            className="pl-10 min-h-[100px] resize-none"
          />
        </div>
        <p className="text-xs text-muted-foreground text-right">
          {watch("bio")?.length || 0}/500 characters
        </p>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white shadow-lg shadow-[#3058EE]/25"
        disabled={isSubmitting}
      >
        Continue to Organization Setup
      </Button>
    </form>
  )
}
