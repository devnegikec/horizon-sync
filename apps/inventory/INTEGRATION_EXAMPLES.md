# Email Communication Integration Examples

This document provides practical examples of integrating the email communication module into different parts of the application.

## Table of Contents

1. [Quotations](#quotations)
2. [Sales Orders](#sales-orders)
3. [Invoices](#invoices)
4. [Purchase Orders](#purchase-orders)
5. [Delivery Notes](#delivery-notes)
6. [RFQs](#rfqs)

---

## Quotations

### In Quotation Detail Dialog

Already implemented in `QuotationDetailDialog.tsx`:

```typescript
import { EmailComposer } from '../common/EmailComposer';

const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);

// Add button in dialog footer
<Button onClick={() => setEmailDialogOpen(true)} className="gap-2">
  <Mail className="h-4 w-4" />
  Send Email
</Button>

// Add EmailComposer component
<EmailComposer
  open={emailDialogOpen}
  onOpenChange={setEmailDialogOpen}
  docType="quotation"
  docId={quotation.id}
  docNo={quotation.quotation_no}
  defaultRecipient={quotation.customer?.email || ''}
  defaultSubject={`Quotation ${quotation.quotation_no}`}
  defaultMessage={`Dear ${quotation.customer_name},\n\nPlease find attached quotation ${quotation.quotation_no} for your review.\n\nBest regards`}
  onSuccess={() => setEmailDialogOpen(false)}
/>
```

### In Quotation Table Row Actions

Add to `QuotationsTable.tsx`:

```typescript
import { Mail } from 'lucide-react';

// In the actions column dropdown
<DropdownMenuItem onClick={() => handleSendEmail(quotation)}>
  <Mail className="mr-2 h-4 w-4" />
  Send Email
</DropdownMenuItem>

// Add handler in parent component
const handleSendEmail = (quotation: Quotation) => {
  setSelectedQuotation(quotation);
  setEmailDialogOpen(true);
};
```

---

## Sales Orders

### In Sales Order Detail View

```typescript
import { EmailComposer } from '../common/EmailComposer';
import { Mail } from 'lucide-react';

function SalesOrderDetail({ salesOrder }) {
  const [emailOpen, setEmailOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setEmailOpen(true)} className="gap-2">
        <Mail className="h-4 w-4" />
        Email Customer
      </Button>

      <EmailComposer
        open={emailOpen}
        onOpenChange={setEmailOpen}
        docType="sales_order"
        docId={salesOrder.id}
        docNo={salesOrder.order_no}
        defaultRecipient={salesOrder.customer_email}
        defaultSubject={`Sales Order Confirmation - ${salesOrder.order_no}`}
        defaultMessage={`Dear ${salesOrder.customer_name},\n\nThank you for your order. Please find the details of your sales order ${salesOrder.order_no}.\n\nOrder Date: ${salesOrder.order_date}\nDelivery Date: ${salesOrder.delivery_date}\n\nBest regards`}
        onSuccess={(communicationId) => {
          console.log('Email sent:', communicationId);
          // Optionally refresh communication history
        }}
      />
    </>
  );
}
```

---

## Invoices

### In Invoice Management

```typescript
import { EmailComposer } from '../common/EmailComposer';
import { Mail } from 'lucide-react';

function InvoiceActions({ invoice }) {
  const [emailOpen, setEmailOpen] = React.useState(false);

  return (
    <>
      <Button
        onClick={() => setEmailOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <Mail className="h-4 w-4" />
        Send Invoice
      </Button>

      <EmailComposer
        open={emailOpen}
        onOpenChange={setEmailOpen}
        docType="invoice"
        docId={invoice.id}
        docNo={invoice.invoice_no}
        defaultRecipient={invoice.customer_email}
        defaultSubject={`Invoice ${invoice.invoice_no} - Payment Due`}
        defaultMessage={`Dear ${invoice.customer_name},\n\nPlease find attached invoice ${invoice.invoice_no}.\n\nInvoice Date: ${invoice.invoice_date}\nDue Date: ${invoice.due_date}\nAmount Due: ${invoice.currency} ${invoice.total_amount}\n\nPlease process payment at your earliest convenience.\n\nBest regards`}
        onSuccess={() => {
          setEmailOpen(false);
          // Mark invoice as sent
        }}
      />
    </>
  );
}
```

---

## Purchase Orders

### In Purchase Order Management

```typescript
import { EmailComposer } from '../common/EmailComposer';
import { Mail } from 'lucide-react';

function PurchaseOrderDetail({ purchaseOrder }) {
  const [emailOpen, setEmailOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setEmailOpen(true)} className="gap-2">
        <Mail className="h-4 w-4" />
        Email Supplier
      </Button>

      <EmailComposer
        open={emailOpen}
        onOpenChange={setEmailOpen}
        docType="purchase_order"
        docId={purchaseOrder.id}
        docNo={purchaseOrder.po_no}
        defaultRecipient={purchaseOrder.supplier_email}
        defaultSubject={`Purchase Order ${purchaseOrder.po_no}`}
        defaultMessage={`Dear ${purchaseOrder.supplier_name},\n\nPlease find attached purchase order ${purchaseOrder.po_no}.\n\nRequired Delivery Date: ${purchaseOrder.required_by_date}\n\nPlease confirm receipt and expected delivery date.\n\nBest regards`}
        onSuccess={() => setEmailOpen(false)}
      />
    </>
  );
}
```

---

## Delivery Notes

### In Delivery Note Management

```typescript
import { EmailComposer } from '../common/EmailComposer';
import { Mail } from 'lucide-react';

function DeliveryNoteActions({ deliveryNote }) {
  const [emailOpen, setEmailOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setEmailOpen(true)} variant="outline">
        <Mail className="h-4 w-4 mr-2" />
        Email Delivery Note
      </Button>

      <EmailComposer
        open={emailOpen}
        onOpenChange={setEmailOpen}
        docType="delivery_note"
        docId={deliveryNote.id}
        docNo={deliveryNote.dn_no}
        defaultRecipient={deliveryNote.customer_email}
        defaultSubject={`Delivery Note ${deliveryNote.dn_no} - Shipment Notification`}
        defaultMessage={`Dear ${deliveryNote.customer_name},\n\nYour order has been shipped. Please find attached delivery note ${deliveryNote.dn_no}.\n\nDelivery Date: ${deliveryNote.delivery_date}\nTracking Number: ${deliveryNote.tracking_no || 'N/A'}\n\nBest regards`}
        onSuccess={() => setEmailOpen(false)}
      />
    </>
  );
}
```

---

## RFQs

### In RFQ Management

```typescript
import { EmailComposer } from '../common/EmailComposer';
import { Mail } from 'lucide-react';

function RFQActions({ rfq }) {
  const [emailOpen, setEmailOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setEmailOpen(true)} className="gap-2">
        <Mail className="h-4 w-4" />
        Send to Supplier
      </Button>

      <EmailComposer
        open={emailOpen}
        onOpenChange={setEmailOpen}
        docType="rfq"
        docId={rfq.id}
        docNo={rfq.rfq_no}
        defaultRecipient={rfq.supplier_email}
        defaultSubject={`Request for Quotation - ${rfq.rfq_no}`}
        defaultMessage={`Dear ${rfq.supplier_name},\n\nWe would like to request a quotation for the items listed in RFQ ${rfq.rfq_no}.\n\nRequired By: ${rfq.required_by_date}\n\nPlease provide your best pricing and delivery terms.\n\nBest regards`}
        onSuccess={() => setEmailOpen(false)}
      />
    </>
  );
}
```

---

## Bulk Email Sending

### Send Email to Multiple Documents

```typescript
import { EmailComposer } from '../common/EmailComposer';

function BulkEmailAction({ selectedQuotations }) {
  const [emailOpen, setEmailOpen] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const handleBulkEmail = async () => {
    // For now, open dialog for first quotation
    // Future: implement queue system
    if (selectedQuotations.length > 0) {
      setCurrentIndex(0);
      setEmailOpen(true);
    }
  };

  const handleSuccess = () => {
    if (currentIndex < selectedQuotations.length - 1) {
      setCurrentIndex(currentIndex + 1);
      // Keep dialog open for next quotation
    } else {
      setEmailOpen(false);
      // All emails sent
    }
  };

  const currentQuotation = selectedQuotations[currentIndex];

  return (
    <>
      <Button onClick={handleBulkEmail}>
        Send Emails ({selectedQuotations.length})
      </Button>

      {currentQuotation && (
        <EmailComposer
          open={emailOpen}
          onOpenChange={setEmailOpen}
          docType="quotation"
          docId={currentQuotation.id}
          docNo={currentQuotation.quotation_no}
          defaultRecipient={currentQuotation.customer_email}
          defaultSubject={`Quotation ${currentQuotation.quotation_no}`}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
```

---

## Common Patterns

### 1. Email Button in Table Actions

```typescript
// In table column definition
{
  id: 'actions',
  cell: ({ row }) => {
    const item = row.original;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleEmail(item)}>
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
}
```

### 2. Email Button in Header Actions

```typescript
<div className="flex gap-2">
  <Button onClick={handleCreate}>Create New</Button>
  <Button variant="outline" onClick={handleEmail}>
    <Mail className="h-4 w-4 mr-2" />
    Send Email
  </Button>
</div>
```

### 3. Conditional Email Button

```typescript
{canSendEmail && (
  <Button onClick={() => setEmailOpen(true)}>
    <Mail className="h-4 w-4 mr-2" />
    Send Email
  </Button>
)}
```

---

## Tips

1. **Always provide default values** for better UX
2. **Use appropriate docType** for tracking
3. **Handle onSuccess** to close dialog or update UI
4. **Validate email addresses** before opening dialog
5. **Show loading states** during send operation
6. **Use toast notifications** for feedback
7. **Consider document status** before allowing email
8. **Add email history view** for sent communications

---

## Next Steps

1. Implement email functionality in remaining modules
2. Add communication history view
3. Create email templates for common scenarios
4. Add email preview before sending
5. Implement scheduled email sending
6. Add email tracking (opens, clicks)
