import * as z from 'zod';

// Invoice validation schemas
export const invoiceLineItemSchema = z.object({
  item_id: z.string().min(1, 'Item is required'),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  uom: z.string().min(1, 'Unit of measure is required'),
  rate: z.number().nonnegative('Rate must be non-negative'),
  tax_template_id: z.string().nullable(),
});

export const invoiceFormSchema = z.object({
  party_id: z.string().min(1, 'Customer is required'),
  party_type: z.enum(['Customer', 'Supplier']),
  posting_date: z.date({
    required_error: 'Posting date is required',
    invalid_type_error: 'Invalid date format',
  }),
  due_date: z.date({
    required_error: 'Due date is required',
    invalid_type_error: 'Invalid date format',
  }),
  currency: z.string().min(1, 'Currency is required'),
  invoice_type: z.enum(['Sales', 'Purchase', 'Debit Note', 'Credit Note']),
  status: z.enum(['Draft', 'Submitted', 'Cancelled']),
  remarks: z.string(),
  line_items: z.array(invoiceLineItemSchema).min(1, 'At least one line item is required'),
}).refine(
  (data) => data.due_date >= data.posting_date,
  {
    message: 'Due date cannot be before posting date',
    path: ['due_date'],
  }
);

// Payment validation schemas
export const paymentAllocationSchema = z.object({
  invoice_id: z.string().min(1, 'Invoice is required'),
  allocated_amount: z.number().positive('Allocated amount must be greater than zero'),
});

export const paymentFormSchema = z.object({
  party_id: z.string().min(1, 'Party is required'),
  party_type: z.enum(['Customer', 'Supplier']),
  payment_date: z.date({
    required_error: 'Payment date is required',
    invalid_type_error: 'Invalid date format',
  }),
  payment_mode: z.enum(['Cash', 'Bank Transfer', 'Credit Card', 'Check', 'Other'], {
    required_error: 'Payment mode is required',
  }),
  reference_number: z.string(),
  currency: z.string().min(1, 'Currency is required'),
  total_amount: z.number().positive('Total amount must be greater than zero'),
  status: z.enum(['Draft', 'Submitted', 'Reconciled', 'Cancelled']),
  remarks: z.string(),
  allocations: z.array(paymentAllocationSchema),
}).refine(
  (data) => {
    const totalAllocated = data.allocations.reduce((sum, alloc) => sum + alloc.allocated_amount, 0);
    return totalAllocated <= data.total_amount;
  },
  {
    message: 'Total allocated amount cannot exceed payment total amount',
    path: ['allocations'],
  }
);

// Type exports for form data
export type InvoiceFormData = z.infer<typeof invoiceFormSchema>;
export type InvoiceLineItemFormData = z.infer<typeof invoiceLineItemSchema>;
export type PaymentFormData = z.infer<typeof paymentFormSchema>;
export type PaymentAllocationFormData = z.infer<typeof paymentAllocationSchema>;
