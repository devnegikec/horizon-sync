# PDF Generation Module

A common module for generating PDFs for various documents (Quotations, Sales Orders, Purchase Orders, Invoices) using `@react-pdf/renderer`.

## Features

- Generate professional PDF documents
- Preview PDFs in browser
- Download PDFs
- Generate base64 encoded PDFs for email attachments
- Auto-attach PDFs when sending emails
- Reusable components for different document types

## Installation

The required dependency is already installed:

```bash
npm install @react-pdf/renderer
```

## Usage

### 1. Generate and Download PDF

```typescript
import { usePDFGeneration } from '../../hooks/usePDFGeneration';
import { convertQuotationToPDFData } from '../../utils/pdf/quotationToPDF';

function MyComponent({ quotation }) {
  const { download, loading } = usePDFGeneration();

  const handleDownload = async () => {
    const pdfData = convertQuotationToPDFData(quotation);
    await download(pdfData, `${quotation.quotation_no}.pdf`);
  };

  return (
    <button onClick={handleDownload} disabled={loading}>
      Download PDF
    </button>
  );
}
```

### 2. Preview PDF in Browser

```typescript
import { usePDFGeneration } from '../../hooks/usePDFGeneration';
import { convertQuotationToPDFData } from '../../utils/pdf/quotationToPDF';

function MyComponent({ quotation }) {
  const { preview, loading } = usePDFGeneration();

  const handlePreview = async () => {
    const pdfData = convertQuotationToPDFData(quotation);
    await preview(pdfData);
  };

  return (
    <button onClick={handlePreview} disabled={loading}>
      Preview PDF
    </button>
  );
}
```

### 3. Generate Base64 for Email Attachment

```typescript
import { usePDFGeneration } from '../../hooks/usePDFGeneration';
import { convertQuotationToPDFData } from '../../utils/pdf/quotationToPDF';

function MyComponent({ quotation }) {
  const { generateBase64, loading } = usePDFGeneration();

  const handleSendEmail = async () => {
    const pdfData = convertQuotationToPDFData(quotation);
    const base64Content = await generateBase64(pdfData);

    if (base64Content) {
      const attachment = {
        filename: `${quotation.quotation_no}.pdf`,
        content: base64Content,
        content_type: 'application/pdf',
      };

      // Use attachment in email
      // ...
    }
  };

  return (
    <button onClick={handleSendEmail} disabled={loading}>
      Send Email with PDF
    </button>
  );
}
```

### 4. Complete Example: QuotationDetailDialog

See `apps/inventory/src/app/components/quotations/QuotationDetailDialog.tsx` for a complete implementation that includes:

- Preview PDF button
- Download PDF button
- Send Email button (auto-attaches PDF)

## Module Structure

```
utils/pdf/
├── types.ts                  # TypeScript type definitions
├── DocumentPDF.tsx           # React PDF component (renders the PDF)
├── generatePDF.ts            # PDF generation utilities
├── quotationToPDF.ts         # Convert Quotation to PDF data
└── index.ts                  # Exports
```

## Adding Support for New Document Types

To add support for a new document type (e.g., Sales Order):

### 1. Create a converter function

```typescript
// utils/pdf/salesOrderToPDF.ts

import type { SalesOrder } from '../../types/salesOrder.types';
import type { PDFDocumentData } from './types';

export const convertSalesOrderToPDFData = (salesOrder: SalesOrder): PDFDocumentData => {
  return {
    type: 'sales_order',
    documentNo: salesOrder.order_no,
    date: salesOrder.order_date,
    dueDate: salesOrder.delivery_date,
    currency: salesOrder.currency,
    currencySymbol: getCurrencySymbol(salesOrder.currency),

    // Company info
    companyName: 'Your Company Name',
    companyAddress: '123 Business Street',

    // Customer info
    customerName: salesOrder.customer_name,
    customerEmail: salesOrder.customer?.email,

    // Line items
    lineItems: salesOrder.items.map((item, index) => ({
      index: index + 1,
      itemName: item.item_name,
      itemCode: item.item_code,
      quantity: Number(item.qty),
      uom: item.uom,
      rate: Number(item.rate),
      amount: Number(item.amount),
      taxAmount: Number(item.tax_amount || 0),
      totalAmount: Number(item.total_amount),
    })),

    // Totals
    subtotal: calculateSubtotal(salesOrder.items),
    totalTax: calculateTotalTax(salesOrder.items),
    grandTotal: Number(salesOrder.grand_total),

    remarks: salesOrder.remarks,
  };
};
```

### 2. Export from index.ts

```typescript
// utils/pdf/index.ts
export * from './salesOrderToPDF';
```

### 3. Use in your component

```typescript
import { convertSalesOrderToPDFData } from '../../utils/pdf';

const pdfData = convertSalesOrderToPDFData(salesOrder);
await download(pdfData, `${salesOrder.order_no}.pdf`);
```

## Customization

### Company Information

Update company details in the converter functions:

```typescript
// utils/pdf/quotationToPDF.ts

companyName: 'Your Company Name',
companyAddress: '123 Business Street, City, State 12345',
companyPhone: '+1 (555) 123-4567',
companyEmail: 'info@yourcompany.com',
```

Consider fetching this from your organization settings/API.

### PDF Styling

Modify styles in `DocumentPDF.tsx`:

```typescript
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  // ... other styles
});
```

### Custom Fonts

To use custom fonts:

```typescript
import { Font } from '@react-pdf/renderer';

Font.register({
  family: 'Roboto',
  src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf',
});

// Then use in styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
  },
});
```

## API Reference

### usePDFGeneration Hook

```typescript
const {
  loading, // boolean - PDF generation in progress
  error, // string | null - Error message if generation failed
  generateBase64, // (data: PDFDocumentData) => Promise<string | null>
  generateBlob, // (data: PDFDocumentData) => Promise<Blob | null>
  download, // (data: PDFDocumentData, filename?: string) => Promise<void>
  preview, // (data: PDFDocumentData) => Promise<void>
} = usePDFGeneration();
```

### PDFDocumentData Type

```typescript
interface PDFDocumentData {
  type: 'quotation' | 'sales_order' | 'purchase_order' | 'invoice';
  documentNo: string;
  date: string;
  validUntil?: string;
  dueDate?: string;
  currency: string;
  currencySymbol: string;
  status?: string;

  // Company info
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;

  // Customer/Supplier info
  customerName: string;
  customerCode?: string;
  customerEmail?: string;

  // Line items
  lineItems: PDFLineItem[];

  // Totals
  subtotal: number;
  totalTax: number;
  grandTotal: number;

  // Tax breakdown
  taxSummary?: Array<{
    name: string;
    amount: number;
    breakup: Array<{
      rule_name: string;
      rate: number;
      amount: number;
    }>;
  }>;

  remarks?: string;
}
```

## Troubleshooting

### PDF not generating

1. Check browser console for errors
2. Ensure all required fields in `PDFDocumentData` are provided
3. Verify numeric values are properly converted (use `Number()`)

### Styling issues

1. React-pdf uses a subset of CSS - not all properties are supported
2. Use flexbox for layouts
3. Test with different data to ensure layout handles edge cases

### Large file sizes

1. Avoid embedding large images
2. Compress images before including
3. Consider pagination for documents with many line items

## Resources

- [React-PDF Documentation](https://react-pdf.org/)
- [React-PDF Examples](https://react-pdf.org/repl)
- [Supported CSS Properties](https://react-pdf.org/styling)
