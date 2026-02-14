import * as React from 'react';
import { Mail } from 'lucide-react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from '@horizon-sync/ui/components';

import type { Invoice } from '../../types/invoice';

interface EmailFormData {
  to: string;
  subject: string;
  body: string;
}

interface SendInvoiceEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onSend: (invoiceId: string, emailData: EmailFormData) => Promise<void>;
  sending: boolean;
}

export function SendInvoiceEmailDialog({
  open,
  onOpenChange,
  invoice,
  onSend,
  sending,
}: SendInvoiceEmailDialogProps) {
  const [formData, setFormData] = React.useState<EmailFormData>({
    to: '',
    subject: '',
    body: '',
  });

  const [errors, setErrors] = React.useState<Partial<Record<keyof EmailFormData, string>>>({});

  // Reset form when dialog opens with new invoice
  React.useEffect(() => {
    if (open && invoice) {
      setFormData({
        to: invoice.party_email || '',
        subject: `Invoice ${invoice.invoice_number}`,
        body: `Dear ${invoice.party_name},\n\nPlease find attached invoice ${invoice.invoice_number} for ${invoice.currency} ${Number(invoice.grand_total).toFixed(2)}.\n\nDue Date: ${new Date(invoice.due_date).toLocaleDateString()}\n\nThank you for your business.\n\nBest regards`,
      });
      setErrors({});
    }
  }, [open, invoice]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EmailFormData, string>> = {};

    if (!formData.to) {
      newErrors.to = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.to)) {
      newErrors.to = 'Invalid email address';
    }

    if (!formData.subject) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.body) {
      newErrors.body = 'Email body is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invoice || !validateForm()) return;

    try {
      await onSend(invoice.id, formData);
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:rounded-lg w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Mail className="h-5 w-5" />
            Send Invoice via Email
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Summary */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Invoice Number</p>
                <p className="font-semibold">{invoice.invoice_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-semibold">{invoice.party_name}</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-medium">
                  {invoice.currency} {Number(invoice.grand_total).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attachment</p>
                <p className="font-medium">Invoice PDF</p>
              </div>
            </div>
          </div>

          {/* Email Form Fields */}
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="email"
              placeholder="customer@example.com"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              className={errors.to ? 'border-red-500' : ''}
            />
            {errors.to && <p className="text-sm text-red-500">{errors.to}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Invoice subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className={errors.subject ? 'border-red-500' : ''}
            />
            {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Email message body"
              className={`min-h-[200px] ${errors.body ? 'border-red-500' : ''}`}
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            />
            {errors.body && <p className="text-sm text-red-500">{errors.body}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={sending} className="gap-2">
              <Mail className="h-4 w-4" />
              {sending ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
