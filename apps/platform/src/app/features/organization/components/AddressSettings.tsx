import * as React from 'react';
import { MapPin, Phone, Mail, Globe, FileText } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Textarea } from '@horizon-sync/ui/components';

import type { AddressConfig } from '../../../types/organization-settings.types';

interface AddressSettingsProps {
  address: AddressConfig;
  onChange: (address: AddressConfig) => void;
  disabled?: boolean;
}

export function AddressSettings({ address, onChange, disabled }: AddressSettingsProps) {
  const handleUpdate = (field: keyof AddressConfig, value: string) => {
    onChange({
      ...address,
      [field]: value,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <CardTitle>Organization Address</CardTitle>
        </div>
        <CardDescription>
          This address will appear on invoices, quotations, and other documents.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="street_address">Street Address *</Label>
          <Textarea
            id="street_address"
            value={address.street_address}
            onChange={(e) => handleUpdate('street_address', e.target.value)}
            disabled={disabled}
            placeholder="123 Business Street, Suite 100"
            rows={2}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={address.city}
              onChange={(e) => handleUpdate('city', e.target.value)}
              disabled={disabled}
              placeholder="New York"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state_province">State/Province *</Label>
            <Input
              id="state_province"
              value={address.state_province}
              onChange={(e) => handleUpdate('state_province', e.target.value)}
              disabled={disabled}
              placeholder="NY"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="postal_code">Postal Code *</Label>
            <Input
              id="postal_code"
              value={address.postal_code}
              onChange={(e) => handleUpdate('postal_code', e.target.value)}
              disabled={disabled}
              placeholder="10001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              value={address.country}
              onChange={(e) => handleUpdate('country', e.target.value)}
              disabled={disabled}
              placeholder="United States"
            />
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-semibold mb-4">Contact Information</h4>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={address.phone || ''}
                onChange={(e) => handleUpdate('phone', e.target.value)}
                disabled={disabled}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={address.email || ''}
                onChange={(e) => handleUpdate('email', e.target.value)}
                disabled={disabled}
                placeholder="contact@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <Globe className="h-3 w-3" />
                Website
              </Label>
              <Input
                id="website"
                type="url"
                value={address.website || ''}
                onChange={(e) => handleUpdate('website', e.target.value)}
                disabled={disabled}
                placeholder="https://www.company.com"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-semibold mb-4">Legal Information</h4>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tax_id" className="flex items-center gap-2">
                <FileText className="h-3 w-3" />
                Tax ID / VAT Number
              </Label>
              <Input
                id="tax_id"
                value={address.tax_id || ''}
                onChange={(e) => handleUpdate('tax_id', e.target.value)}
                disabled={disabled}
                placeholder="12-3456789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration_number" className="flex items-center gap-2">
                <FileText className="h-3 w-3" />
                Registration Number
              </Label>
              <Input
                id="registration_number"
                value={address.registration_number || ''}
                onChange={(e) => handleUpdate('registration_number', e.target.value)}
                disabled={disabled}
                placeholder="REG-123456"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
