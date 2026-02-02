import * as React from 'react';

import { Users, MapPin, Plus, X } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import { Separator } from '@horizon-sync/ui/components/ui/separator';

import type { Customer, Address } from '../../types/customer.types';

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSave: (customer: Partial<Customer>) => void;
}

const paymentTermsOptions = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt'];

const emptyAddress: Omit<Address, 'id'> = {
  label: '',
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'USA',
};

export function CustomerDialog({
  open,
  onOpenChange,
  customer,
  onSave,
}: CustomerDialogProps) {
  const [formData, setFormData] = React.useState({
    customerCode: '',
    name: '',
    email: '',
    phone: '',
    creditLimit: '',
    paymentTerms: 'Net 30',
  });

  const [billingAddress, setBillingAddress] = React.useState<Omit<Address, 'id'>>(emptyAddress);
  const [shippingAddresses, setShippingAddresses] = React.useState<Omit<Address, 'id' | 'isDefault'>[]>([
    { ...emptyAddress, label: 'Primary' },
  ]);

  const isEditing = !!customer;

  React.useEffect(() => {
    if (customer) {
      setFormData({
        customerCode: customer.customerCode,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        creditLimit: customer.creditLimit.toString(),
        paymentTerms: customer.paymentTerms,
      });
      setBillingAddress(customer.billingAddress);
      setShippingAddresses(customer.shippingAddresses);
    } else {
      setFormData({
        customerCode: '',
        name: '',
        email: '',
        phone: '',
        creditLimit: '',
        paymentTerms: 'Net 30',
      });
      setBillingAddress({ ...emptyAddress });
      setShippingAddresses([{ ...emptyAddress, label: 'Primary' }]);
    }
  }, [customer, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      creditLimit: parseFloat(formData.creditLimit) || 0,
      billingAddress: { ...billingAddress, id: customer?.billingAddress.id || Date.now().toString() },
      shippingAddresses: shippingAddresses.map((addr, index) => ({
        ...addr,
        id: customer?.shippingAddresses[index]?.id || `${Date.now()}-${index}`,
        isDefault: index === 0,
      })),
    });
    onOpenChange(false);
  };

  const addShippingAddress = () => {
    setShippingAddresses([...shippingAddresses, { ...emptyAddress, label: `Address ${shippingAddresses.length + 1}` }]);
  };

  const removeShippingAddress = (index: number) => {
    if (shippingAddresses.length > 1) {
      setShippingAddresses(shippingAddresses.filter((_, i) => i !== index));
    }
  };

  const updateShippingAddress = (index: number, field: string, value: string) => {
    setShippingAddresses(
      shippingAddresses.map((addr, i) =>
        i === index ? { ...addr, [field]: value } : addr
      )
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{isEditing ? 'Edit Customer' : 'Create New Customer'}</DialogTitle>
              <DialogDescription>
                {isEditing
                  ? 'Update customer information and addresses'
                  : 'Add a new customer to your system'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Basic Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerCode">Customer Code</Label>
                  <Input id="customerCode"
                    value={formData.customerCode}
                    onChange={(e) =>
                      setFormData({ ...formData, customerCode: e.target.value })
                    }
                    placeholder="e.g., CUST-001"
                    required/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter company name"
                    required/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="contact@company.com"
                    required/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+1-555-0000"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="creditLimit">Credit Limit ($)</Label>
                  <Input id="creditLimit"
                    type="number"
                    min="0"
                    value={formData.creditLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, creditLimit: e.target.value })
                    }
                    placeholder="0.00"/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Select value={formData.paymentTerms}
                    onValueChange={(value) =>
                      setFormData({ ...formData, paymentTerms: value })
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select terms" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTermsOptions.map((term) => (
                        <SelectItem key={term} value={term}>
                          {term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Billing Address */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Billing Address
              </h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Street Address</Label>
                  <Input value={billingAddress.street}
                    onChange={(e) =>
                      setBillingAddress({ ...billingAddress, street: e.target.value })
                    }
                    placeholder="123 Main Street"/>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input value={billingAddress.city}
                      onChange={(e) =>
                        setBillingAddress({ ...billingAddress, city: e.target.value })
                      }
                      placeholder="City"/>
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input value={billingAddress.state}
                      onChange={(e) =>
                        setBillingAddress({ ...billingAddress, state: e.target.value })
                      }
                      placeholder="State"/>
                  </div>
                  <div className="space-y-2">
                    <Label>Postal Code</Label>
                    <Input value={billingAddress.postalCode}
                      onChange={(e) =>
                        setBillingAddress({ ...billingAddress, postalCode: e.target.value })
                      }
                      placeholder="12345"/>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Shipping Addresses */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Shipping Addresses
                </h4>
                <Button type="button"
                  variant="outline"
                  size="sm"
                  onClick={addShippingAddress}
                  className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add Address
                </Button>
              </div>
              {shippingAddresses.map((addr, index) => (
                <div key={index} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Input value={addr.label}
                      onChange={(e) => updateShippingAddress(index, 'label', e.target.value)}
                      placeholder="Address Label"
                      className="w-40"/>
                    {shippingAddresses.length > 1 && (
                      <Button type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeShippingAddress(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Input value={addr.street}
                    onChange={(e) => updateShippingAddress(index, 'street', e.target.value)}
                    placeholder="Street Address"/>
                  <div className="grid grid-cols-3 gap-3">
                    <Input value={addr.city}
                      onChange={(e) => updateShippingAddress(index, 'city', e.target.value)}
                      placeholder="City"/>
                    <Input value={addr.state}
                      onChange={(e) => updateShippingAddress(index, 'state', e.target.value)}
                      placeholder="State"/>
                    <Input value={addr.postalCode}
                      onChange={(e) => updateShippingAddress(index, 'postalCode', e.target.value)}
                      placeholder="Postal Code"/>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? 'Save Changes' : 'Create Customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
