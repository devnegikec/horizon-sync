import * as React from 'react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';

import type { Organization, UpdateOrganizationRequest } from '../types/organization.types';

interface OrganizationFormProps {
  organization: Organization;
  onSave: (data: UpdateOrganizationRequest) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

interface FormData {
  name: string;
  display_name: string;
}

interface FormErrors {
  name?: string;
  display_name?: string;
}

/**
 * OrganizationForm Component
 * 
 * Editable form for updating organization details.
 * 
 * Requirements: 7.4, 2.3, 2.7, 3.1, 3.2, 3.3, 3.4
 */
export function OrganizationForm({ organization, onSave, onCancel, isLoading }: OrganizationFormProps) {
  const [formData, setFormData] = React.useState<FormData>({
    name: organization.name,
    display_name: organization.display_name || '',
  });

  const [errors, setErrors] = React.useState<FormErrors>({});

  /**
   * Validate form fields
   * Requirements: 3.1, 3.2, 3.3
   */
  const validateField = (fieldName: keyof FormData, value: string): string | undefined => {
    if (fieldName === 'name') {
      // Requirement 3.1: Name is required
      if (!value.trim()) {
        return 'Organization name is required';
      }
      // Requirement 3.2: Name max 100 characters
      if (value.length > 100) {
        return 'Organization name must not exceed 100 characters';
      }
    }

    if (fieldName === 'display_name') {
      // Requirement 3.3: Display name max 100 characters
      if (value.length > 100) {
        return 'Display name must not exceed 100 characters';
      }
    }

    return undefined;
  };

  /**
   * Validate all form fields
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const nameError = validateField('name', formData.name);
    if (nameError) {
      newErrors.name = nameError;
    }

    const displayNameError = validateField('display_name', formData.display_name);
    if (displayNameError) {
      newErrors.display_name = displayNameError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle input change with validation
   */
  const handleInputChange = (fieldName: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[fieldName]) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: undefined,
      }));
    }
  };

  /**
   * Handle form submission
   * Requirements: 2.4, 3.4
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    // Prepare update data
    const updateData: UpdateOrganizationRequest = {
      name: formData.name.trim(),
      display_name: formData.display_name.trim() || null,
    };

    try {
      await onSave(updateData);
    } catch (error) {
      // Error handling is done by parent component
      console.error('Form submission error:', error);
    }
  };

  /**
   * Check if form is valid
   * Requirement 3.4: Enable submit button when all required fields are valid
   */
  const isFormValid = (): boolean => {
    const nameValid = formData.name.trim().length > 0 && formData.name.length <= 100;
    const displayNameValid = formData.display_name.length <= 100;
    return nameValid && displayNameValid;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Organization Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Organization Name <span className="text-destructive">*</span>
        </Label>
        <Input id="name"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          disabled={isLoading}
          className={errors.name ? 'border-destructive' : ''}
          placeholder="Enter organization name"/>
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
        <p className="text-xs text-muted-foreground">
          The official name of your organization (max 100 characters)
        </p>
      </div>

      {/* Display Name Field */}
      <div className="space-y-2">
        <Label htmlFor="display_name">Display Name</Label>
        <Input id="display_name"
          type="text"
          value={formData.display_name}
          onChange={(e) => handleInputChange('display_name', e.target.value)}
          disabled={isLoading}
          className={errors.display_name ? 'border-destructive' : ''}
          placeholder="Enter display name (optional)"/>
        {errors.display_name && (
          <p className="text-sm text-destructive">{errors.display_name}</p>
        )}
        <p className="text-xs text-muted-foreground">
          A friendly name for your organization (optional, max 100 characters)
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit"
          disabled={isLoading || !isFormValid()}
          className="bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white">
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
