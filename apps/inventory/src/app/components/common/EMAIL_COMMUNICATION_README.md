# Email Communication Module

A reusable email communication component system for sending emails across all modules in the application.

## Overview

The email communication module provides:

- Reusable email composer dialog with attachments support
- Integration with backend communication API
- Toast notifications for success/failure
- Document linking (quotations, invoices, sales orders, etc.)
- CC recipients support
- File size validation
- Base64 file encoding

## Components

### 1. EmailComposerDialog (Shared UI Component)

Location: `libs/shared/ui/src/components/email/EmailComposerDialog.tsx`

A generic, reusable dialog component for composing emails.

**Props:**

```typescript
interface EmailComposerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultRecipient?: string;
  defaultSubject?: string;
  defaultMessage?: string;
  onSend: (data: EmailComposerData) => Promise<void>;
  sending?: boolean;
  maxFileSize?: number; // in bytes, default 10MB
}
```

### 2. EmailComposer (App-Specific Wrapper)

Location: `apps/inventory/src/app/components/common/EmailComposer.tsx`

Wraps the EmailComposerDialog with API integration and toast notifications.

**Props:**

```typescript
interface EmailComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docType?: DocType;
  docId?: string;
  docNo?: string;
  defaultRecipient?: string;
  defaultSubject?: string;
  defaultMessage?: string;
  onSuccess?: (communicationId: string | null) => void;
}
```

## Usage Examples

### Basic Usage in Any Module

```typescript
import { EmailComposer } from '../common/EmailComposer';

function MyComponent() {
  const [emailOpen, setEmailOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setEmailOpen(true)}>
        Send Email
      </Button>

      <EmailComposer
        open={emailOpen}
        onOpenChange={setEmailOpen}
        docType="quotation"
        docId="123"
        docNo="QT-001"
        defaultRecipient="customer@example.com"
        defaultSubject="Quotation QT-001"
        defaultMessage="Please find the quotation attached."
        onSuccess={(communicationId) => {
          console.log('Email sent:', communicationId);
        }}
      />
    </>
  );
}
```

### Integration with Quotation Detail Dialog

See: `apps/inventory/src/app/components/quotations/QuotationDetailDialog.tsx`

```typescript
const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);

// In the dialog footer
<Button onClick={() => setEmailDialogOpen(true)}>
  <Mail className="h-4 w-4" />
  Send Email
</Button>

<EmailComposer
  open={emailDialogOpen}
  onOpenChange={setEmailDialogOpen}
  docType="quotation"
  docId={quotation.id}
  docNo={quotation.quotation_no}
  defaultRecipient={quotation.customer?.email || ''}
  defaultSubject={`Quotation ${quotation.quotation_no}`}
  defaultMessage={`Dear ${quotation.customer_name},\n\nPlease find attached quotation...`}
  onSuccess={() => setEmailDialogOpen(false)}
/>
```

### Usage in Other Modules

#### Sales Orders

```typescript
<EmailComposer
  open={emailOpen}
  onOpenChange={setEmailOpen}
  docType="sales_order"
  docId={salesOrder.id}
  docNo={salesOrder.order_no}
  defaultRecipient={salesOrder.customer_email}
  defaultSubject={`Sales Order ${salesOrder.order_no}`}
/>
```

#### Invoices

```typescript
<EmailComposer
  open={emailOpen}
  onOpenChange={setEmailOpen}
  docType="invoice"
  docId={invoice.id}
  docNo={invoice.invoice_no}
  defaultRecipient={invoice.customer_email}
  defaultSubject={`Invoice ${invoice.invoice_no}`}
/>
```

#### Purchase Orders

```typescript
<EmailComposer
  open={emailOpen}
  onOpenChange={setEmailOpen}
  docType="purchase_order"
  docId={purchaseOrder.id}
  docNo={purchaseOrder.po_no}
  defaultRecipient={purchaseOrder.supplier_email}
  defaultSubject={`Purchase Order ${purchaseOrder.po_no}`}
/>
```

## API Integration

### Communication API

Location: `apps/inventory/src/app/utility/api/communications.ts`

```typescript
communicationApi.sendEmail(accessToken, {
  to: 'recipient@example.com',
  cc: ['cc1@example.com', 'cc2@example.com'],
  subject: 'Email Subject',
  message: 'Email body',
  attachments: [
    {
      filename: 'document.pdf',
      content: 'base64EncodedContent',
      content_type: 'application/pdf',
    },
  ],
  doc_type: 'quotation',
  doc_id: '123',
  doc_no: 'QT-001',
});
```

### Hook: useSendEmail

Location: `apps/inventory/src/app/hooks/useSendEmail.ts`

```typescript
const { sendEmail, loading, error } = useSendEmail();

await sendEmail({
  to: 'recipient@example.com',
  subject: 'Test',
  message: 'Hello',
  // ... other fields
});
```

## Types

### DocType

```typescript
type DocType =
  | 'quotation'
  | 'sales_order'
  | 'purchase_order'
  | 'invoice'
  | 'delivery_note'
  | 'purchase_receipt'
  | 'payment'
  | 'rfq'
  | 'material_request';
```

### EmailAttachment

```typescript
interface EmailAttachment {
  filename: string;
  content: string; // base64 encoded
  content_type?: string;
  size?: number;
}
```

## Features

### File Attachments

- Multiple file upload support
- Base64 encoding
- File size validation (default 10MB max)
- File type detection
- Remove attachments before sending

### CC Recipients

- Add multiple CC recipients
- Comma-separated input
- Remove individual CC recipients
- Badge display for added recipients

### Validation

- Required fields: To, Subject, Message
- Email format validation (HTML5)
- File size limits
- Error messages for failed uploads

### User Feedback

- Loading states during send
- Toast notifications for success/failure
- Error messages in dialog
- Disabled send button while sending

## Backend API

### Endpoint

```
POST /api/v1/communications/send
```

### Request Body

```json
{
  "to": "recipient@example.com",
  "cc": ["cc1@example.com"],
  "subject": "Email Subject",
  "message": "Email body",
  "html_message": "<p>HTML email body</p>",
  "attachments": [
    {
      "filename": "document.pdf",
      "content": "base64EncodedContent",
      "content_type": "application/pdf"
    }
  ],
  "doc_type": "quotation",
  "doc_id": "uuid",
  "doc_no": "QT-001"
}
```

### Response

```json
{
  "status": "sent",
  "message": "Email sent successfully",
  "communication_id": "uuid"
}
```

## Styling

The component uses shadcn/ui components with Tailwind CSS:

- Dialog with overlay
- Form inputs with labels
- Badge components for CC recipients
- Button variants (outline, default)
- Loading spinner
- Muted backgrounds for attachments

## Best Practices

1. **Always provide default values** when possible (recipient, subject, message)
2. **Handle success callback** to close dialog or refresh data
3. **Use appropriate docType** for tracking
4. **Validate email addresses** before opening dialog if possible
5. **Show loading states** to prevent duplicate sends
6. **Handle errors gracefully** with toast notifications

## Future Enhancements

- Rich text editor for HTML emails
- Email templates
- Draft saving to localStorage
- Scheduled sending
- Email preview before send
- Communication history view
- Reply/Forward functionality
- Bulk email sending

## Testing

To test the email functionality:

1. Ensure backend API is running
2. Configure SMTP settings in backend
3. Open any document detail view
4. Click "Send Email" button
5. Fill in recipient, subject, message
6. Optionally add CC and attachments
7. Click "Send Email"
8. Check toast notification for success/failure

## Troubleshooting

### Email not sending

- Check backend SMTP configuration
- Verify API endpoint is accessible
- Check browser console for errors
- Verify access token is valid

### Attachments failing

- Check file size (default max 10MB)
- Verify file type is supported
- Check browser console for encoding errors

### Toast not showing

- Verify useToast hook is properly configured
- Check Toaster component is in app root
