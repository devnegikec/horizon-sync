import * as React from 'react';

import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';

import { isAtMaxLength } from '../../utility/validation-schemas';

import { COUNTRIES } from './customer.helpers';
import { TagInput } from './TagInput';
import type { CustomerFormData } from './types';

interface CustomerFormFieldsProps {
  formData: CustomerFormData;
  isEdit: boolean;
  onFieldChange: (field: keyof CustomerFormData, value: string | string[]) => void;
  fieldErrors?: Record<string, string>;
}

/** Inline character count + over-limit error */
function CharCount({ value, max }: { value: string; max: number }) {
  const over = (value?.length || 0) > max;
  const atLimit = isAtMaxLength(value, max);
  return (
    <>
      {over && <p className="text-xs text-red-500">Cannot exceed {max} characters</p>}
      <p className={cn('text-xs text-right', atLimit ? 'text-red-500 font-medium' : 'text-muted-foreground')}>{value?.length || 0}/{max}</p>
    </>
  );
}

export function CustomerFormFields({ formData, isEdit, onFieldChange, fieldErrors = {} }: CustomerFormFieldsProps) {
  return (
    <>
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customer_code">Customer Code</Label>
            <Input id="customer_code"
              value={formData.customer_code}
              disabled
              placeholder="Auto-generated"
              className="cursor-not-allowed opacity-60" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer_name">Customer Name *</Label>
            <Input id="customer_name"
              value={formData.customer_name}
              onChange={(e) => onFieldChange('customer_name', e.target.value)}
              placeholder="Company Name"
              className={cn((fieldErrors['customer_name'] || formData.customer_name.length > 255) && 'border-red-500')}
              required />
            {fieldErrors['customer_name'] && <p className="text-xs text-red-500">{fieldErrors['customer_name']}</p>}
            <CharCount value={formData.customer_name} max={255} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email"
              type="email"
              value={formData.email}
              onChange={(e) => onFieldChange('email', e.target.value)}
              placeholder="contact@company.com"
              className={cn((fieldErrors['email'] || formData.email.length > 255) && 'border-red-500')}
              required />
            {fieldErrors['email'] && <p className="text-xs text-red-500">{fieldErrors['email']}</p>}
            <CharCount value={formData.email} max={255} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input id="phone"
              value={formData.phone}
              onChange={(e) => onFieldChange('phone', e.target.value)}
              placeholder="+91-9711452000"
              className={cn(formData.phone.length > 50 && 'border-red-500')}
              required />
            <CharCount value={formData.phone} max={50} />
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Address Information</h3>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea id="address"
            value={formData.address}
            onChange={(e) => onFieldChange('address', e.target.value)}
            placeholder="Complete address"
            className={cn(formData.address.length > 1000 && 'border-red-500')}
            rows={2} />
          <CharCount value={formData.address} max={1000} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="address_line1">Address Line 1</Label>
            <Input id="address_line1"
              value={formData.address_line1}
              onChange={(e) => onFieldChange('address_line1', e.target.value)}
              placeholder="123, B block" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address_line2">Address Line 2</Label>
            <Input id="address_line2"
              value={formData.address_line2}
              onChange={(e) => onFieldChange('address_line2', e.target.value)}
              placeholder="Indra Nagar" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input id="city"
              value={formData.city}
              onChange={(e) => onFieldChange('city', e.target.value)}
              placeholder="Bangalore"
              required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state"
              value={formData.state}
              onChange={(e) => onFieldChange('state', e.target.value)}
              placeholder="Karnataka" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postal_code">Postal Code</Label>
            <Input id="postal_code"
              value={formData.postal_code}
              onChange={(e) => onFieldChange('postal_code', e.target.value)}
              placeholder="560087" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select value={formData.country} onValueChange={(v) => onFieldChange('country', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Business Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Business Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tax_number">Tax Number</Label>
            <Input id="tax_number"
              value={formData.tax_number}
              onChange={(e) => onFieldChange('tax_number', e.target.value)}
              placeholder="zo87992jd8kk99" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(v) => onFieldChange('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="credit_limit">Credit Limit</Label>
            <Input id="credit_limit"
              type="number"
              min="0"
              step="0.01"
              value={formData.credit_limit}
              onChange={(e) => onFieldChange('credit_limit', e.target.value)}
              placeholder="10000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="outstanding_balance">Outstanding Balance</Label>
            <Input id="outstanding_balance"
              type="number"
              min="0"
              step="0.01"
              value={formData.outstanding_balance}
              onChange={(e) => onFieldChange('outstanding_balance', e.target.value)}
              placeholder="0.00" />
          </div>
        </div>
      </div>

      {/* Tags */}
      <TagInput tags={formData.tags} onChange={(tags) => onFieldChange('tags', tags)} />
    </>
  );
}
