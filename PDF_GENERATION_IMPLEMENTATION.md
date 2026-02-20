# PDF Generation Module - Implementation Summary

## Overview

A comprehensive PDF generation module has been implemented for the Horizon Sync inventory application. The module uses `@react-pdf/renderer` to create professional PDF documents for Quotations, Sales Orders, Purchase Orders, and Invoices.

## What Was Implemented

### 1. Core PDF Module (`apps/inventory/src/app/utils/pdf/`)

#### Files Created:

- **types.ts** - TypeScript type definitions for PDF data structures
- **DocumentPDF.tsx** - React component that renders the PDF using @react-pdf/renderer
- **generatePDF.ts** - Utility functions for PDF generation (blob, base64, download, preview)
- **quotationToPDF.ts** - Converter function to transform Quotation data to PDF format
- **index.ts** - Module exports
- **README.md** - Comprehensive documentation
- **EXAMPLES.md** - Usage examples for various scenarios

### 2. React Hook (`apps/inventory/src/app/hooks/`)

#### usePDFGeneration.ts

A custom hook that provides:

- `generateBase64()` - Generate base64 encoded PDF for email attachments
- `generateBlob()` - Generate PDF blob for custom handling
- `download()` - Download PDF file directly
- `preview()` - Open PDF in new browser tab
- `loading` - Loading state
- `error` - Error state

### 3. Integration with Quotation Module

#### Updated Files:

**QuotationDetailDialog.tsx**

- Added "Preview PDF" button
- Added "Download PDF" button
- Modified "Send Email" button to auto-attach PDF
- Integrated usePDFGeneration hook
- Added toast notifications for user feedback

**EmailComposer.tsx**

- Added support for `defaultAttachments` prop
- Merges default attachments (PDF) with user-added attachments
- Passes attachments to email service

**EmailComposerDialog.tsx** (UI Library)

- Added `defaultAttachments` prop support
- Shows "Auto-attached" badge for default attachments
- Allows users to remove auto-attached files if needed

## Features

### PDF Generation

✅ Professional document layout with company header
✅ Document information (number, date, validity, status)
✅ Customer/supplier details
✅ Line items table with item details, quantities, rates
✅ Tax breakdown with individual tax components
✅ Subtotal, tax total, and grand total
✅ Remarks section
✅ Footer with generation date

### User Actions

✅ Preview PDF in browser (opens in new tab)
✅ Download PDF with custom filename
✅ Auto-attach PDF when sending email
✅ Loading states during generation
✅ Error handling with user-friendly messages

### Email Integration

✅ Automatically generates PDF when user clicks "Send Email"
✅ Attaches PDF to email with proper filename
✅ Shows "Auto-attached" badge in email composer
✅ Users can still add additional attachments
✅ Users can remove auto-attached PDF if needed

## How It Works

### 1. User clicks "Send Email" on Quotation Detail Dialog

```typescript
const handleSendEmail = async () => {
  // 1. Convert quotation to PDF data format
  const pdfData = convertQuotationToPDFData(quotation);

  // 2. Generate base64 encoded PDF
  const base64Content = await generateBase64(pdfData);

  // 3. Create attachment object
  if (base64Content) {
    setPdfAttachment({
      filename: `${quotation.quotation_no}.pdf`,
      content: base64Content,
      content_type: 'application/pdf',
    });

    // 4. Open email composer with PDF attached
    setEmailDialogOpen(true);
  }
};
```

### 2. Email Composer receives default attachment

```typescript
<EmailComposer
  defaultAttachments={pdfAttachment ? [pdfAttachment] : undefined}
  // ... other props
/>
```

### 3. Email is sent with PDF attached

```typescript
const handleSend = async (data) => {
  // Merge default attachments (PDF) with user-added attachments
  const allAttachments = [...(defaultAttachments || []), ...data.attachments];

  await sendEmail({
    attachments: allAttachments.length > 0 ? allAttachments : undefined,
    // ... other email data
  });
};
```

## File Structure

```
apps/inventory/src/app/
├── utils/pdf/
│   ├── types.ts                    # Type definitions
│   ├── DocumentPDF.tsx             # PDF React component
│   ├── generatePDF.ts              # Generation utilities
│   ├── quotationToPDF.ts           # Quotation converter
│   ├── index.ts                    # Exports
│   ├── README.md                   # Documentation
│   └── EXAMPLES.md                 # Usage examples
├── hooks/
│   └── usePDFGeneration.ts         # PDF generation hook
└── components/
    ├── quotations/
    │   └── QuotationDetailDialog.tsx  # Updated with PDF features
    └── common/
        └── EmailComposer.tsx          # Updated with attachment support

libs/shared/ui/src/components/email/
└── EmailComposerDialog.tsx         # Updated with defaultAttachments
```

## Dependencies

```json
{
  "@react-pdf/renderer": "^3.x.x"
}
```

## Usage Examples

### Download PDF

```typescript
const { download } = usePDFGeneration();
const pdfData = convertQuotationToPDFData(quotation);
await download(pdfData, `${quotation.quotation_no}.pdf`);
```

### Preview PDF

```typescript
const { preview } = usePDFGeneration();
const pdfData = convertQuotationToPDFData(quotation);
await preview(pdfData);
```

### Generate for Email

```typescript
const { generateBase64 } = usePDFGeneration();
const pdfData = convertQuotationToPDFData(quotation);
const base64 = await generateBase64(pdfData);

const attachment = {
  filename: `${quotation.quotation_no}.pdf`,
  content: base64,
  content_type: 'application/pdf',
};
```

## Extending to Other Document Types

To add PDF support for Sales Orders, Purchase Orders, or Invoices:

1. Create a converter function (e.g., `salesOrderToPDF.ts`)
2. Follow the same pattern as `quotationToPDF.ts`
3. Export from `index.ts`
4. Use in your components with `usePDFGeneration` hook

Example:

```typescript
// utils/pdf/salesOrderToPDF.ts
export const convertSalesOrderToPDFData = (salesOrder: SalesOrder): PDFDocumentData => {
  return {
    type: 'sales_order',
    documentNo: salesOrder.order_no,
    // ... map all fields
  };
};

// In component
const pdfData = convertSalesOrderToPDFData(salesOrder);
await download(pdfData, `${salesOrder.order_no}.pdf`);
```

## Customization

### Company Information

Update in converter functions:

```typescript
companyName: 'Your Company Name',
companyAddress: '123 Business Street',
companyPhone: '+1 (555) 123-4567',
companyEmail: 'info@company.com',
```

### PDF Styling

Modify `DocumentPDF.tsx` styles:

```typescript
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    // ... customize
  },
});
```

### Custom Fonts

```typescript
import { Font } from '@react-pdf/renderer';

Font.register({
  family: 'CustomFont',
  src: 'path/to/font.ttf',
});
```

## Testing

Test the following scenarios:

- ✅ Download PDF for quotation
- ✅ Preview PDF in browser
- ✅ Send email with auto-attached PDF
- ✅ Add additional attachments to email
- ✅ Remove auto-attached PDF
- ✅ Handle quotations with no line items
- ✅ Handle quotations with many line items
- ✅ Handle quotations with tax breakdown
- ✅ Handle quotations without taxes
- ✅ Error handling when PDF generation fails

## Benefits

1. **Reusable** - Common module for all document types
2. **Professional** - Clean, formatted PDF output
3. **User-friendly** - Preview before download/send
4. **Integrated** - Seamless email attachment
5. **Extensible** - Easy to add new document types
6. **Type-safe** - Full TypeScript support
7. **Error handling** - Graceful error messages
8. **Performance** - Efficient PDF generation

## Next Steps

1. Add PDF support for Sales Orders
2. Add PDF support for Purchase Orders
3. Add PDF support for Invoices
4. Fetch company information from organization settings
5. Add custom branding/logo support
6. Add PDF templates for different document types
7. Add print functionality
8. Add PDF archiving/storage

## Resources

- [React-PDF Documentation](https://react-pdf.org/)
- [Module README](apps/inventory/src/app/utils/pdf/README.md)
- [Usage Examples](apps/inventory/src/app/utils/pdf/EXAMPLES.md)
