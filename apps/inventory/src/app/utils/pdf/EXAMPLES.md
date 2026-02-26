# PDF Generation Examples

## Example 1: Basic Download Button

```typescript
import { usePDFGeneration } from '../../hooks/usePDFGeneration';
import { convertQuotationToPDFData } from '../../utils/pdf';

export function DownloadQuotationButton({ quotation }) {
  const { download, loading, error } = usePDFGeneration();

  const handleDownload = async () => {
    const pdfData = convertQuotationToPDFData(quotation);
    await download(pdfData, `Quotation-${quotation.quotation_no}.pdf`);
  };

  return (
    <div>
      <button onClick={handleDownload} disabled={loading}>
        {loading ? 'Generating...' : 'Download PDF'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

## Example 2: Preview and Download

```typescript
import { Download, Eye } from 'lucide-react';
import { Button } from '@horizon-sync/ui/components';
import { usePDFGeneration } from '../../hooks/usePDFGeneration';
import { convertQuotationToPDFData } from '../../utils/pdf';

export function QuotationPDFActions({ quotation }) {
  const { download, preview, loading } = usePDFGeneration();

  const pdfData = convertQuotationToPDFData(quotation);

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => preview(pdfData)}
        disabled={loading}
      >
        <Eye className="h-4 w-4 mr-2" />
        Preview
      </Button>

      <Button
        variant="outline"
        onClick={() => download(pdfData, `${quotation.quotation_no}.pdf`)}
        disabled={loading}
      >
        <Download className="h-4 w-4 mr-2" />
        Download
      </Button>
    </div>
  );
}
```

## Example 3: Email with Auto-attached PDF

```typescript
import { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';
import { usePDFGeneration } from '../../hooks/usePDFGeneration';
import { convertQuotationToPDFData } from '../../utils/pdf';
import { EmailComposer } from '../common/EmailComposer';

export function SendQuotationEmail({ quotation }) {
  const [emailOpen, setEmailOpen] = useState(false);
  const [pdfAttachment, setPdfAttachment] = useState(null);
  const { generateBase64, loading } = usePDFGeneration();
  const { toast } = useToast();

  const handleOpenEmail = async () => {
    try {
      const pdfData = convertQuotationToPDFData(quotation);
      const base64 = await generateBase64(pdfData);

      if (base64) {
        setPdfAttachment({
          filename: `${quotation.quotation_no}.pdf`,
          content: base64,
          content_type: 'application/pdf',
        });
        setEmailOpen(true);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Button onClick={handleOpenEmail} disabled={loading}>
        <Mail className="h-4 w-4 mr-2" />
        Send Email
      </Button>

      <EmailComposer
        open={emailOpen}
        onOpenChange={setEmailOpen}
        docType="quotation"
        docId={quotation.id}
        docNo={quotation.quotation_no}
        defaultRecipient={quotation.customer?.email}
        defaultSubject={`Quotation ${quotation.quotation_no}`}
        defaultMessage={`Dear ${quotation.customer_name},\n\nPlease find attached quotation for your review.`}
        defaultAttachments={pdfAttachment ? [pdfAttachment] : undefined}
        onSuccess={() => {
          setEmailOpen(false);
          setPdfAttachment(null);
        }}
      />
    </>
  );
}
```

## Example 4: Bulk PDF Generation

```typescript
import { usePDFGeneration } from '../../hooks/usePDFGeneration';
import { convertQuotationToPDFData } from '../../utils/pdf';

export function BulkDownloadQuotations({ quotations }) {
  const { generateBlob, loading } = usePDFGeneration();

  const handleBulkDownload = async () => {
    for (const quotation of quotations) {
      const pdfData = convertQuotationToPDFData(quotation);
      const blob = await generateBlob(pdfData);

      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${quotation.quotation_no}.pdf`;
        link.click();
        URL.revokeObjectURL(url);

        // Add delay to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  return (
    <button onClick={handleBulkDownload} disabled={loading}>
      {loading ? 'Generating PDFs...' : `Download ${quotations.length} PDFs`}
    </button>
  );
}
```

## Example 5: Custom PDF for Sales Order

```typescript
// First, create the converter
// utils/pdf/salesOrderToPDF.ts

import type { SalesOrder } from '../../types/salesOrder.types';
import { SUPPORTED_CURRENCIES } from '../../types/currency.types';
import type { PDFDocumentData, PDFLineItem } from './types';

export const convertSalesOrderToPDFData = (salesOrder: SalesOrder): PDFDocumentData => {
  const lineItems = salesOrder.items || [];

  const getCurrencySymbol = (currencyCode: string): string => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  };

  const pdfLineItems: PDFLineItem[] = lineItems.map((item, index) => ({
    index: index + 1,
    itemName: item.item_name || '',
    itemCode: item.item_code,
    quantity: Number(item.qty),
    uom: item.uom,
    rate: Number(item.rate),
    amount: Number(item.amount),
    taxAmount: item.tax_amount ? Number(item.tax_amount) : undefined,
    totalAmount: Number(item.total_amount || item.amount),
  }));

  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalTax = lineItems.reduce((sum, item) => sum + Number(item.tax_amount || 0), 0);

  return {
    type: 'sales_order',
    documentNo: salesOrder.order_no,
    date: salesOrder.order_date,
    dueDate: salesOrder.delivery_date,
    currency: salesOrder.currency,
    currencySymbol: getCurrencySymbol(salesOrder.currency),
    status: salesOrder.status,

    companyName: 'Your Company Name',
    companyAddress: '123 Business Street',
    companyPhone: '+1 (555) 123-4567',
    companyEmail: 'info@company.com',

    customerName: salesOrder.customer_name,
    customerCode: salesOrder.customer?.customer_code,
    customerEmail: salesOrder.customer?.email,

    lineItems: pdfLineItems,
    subtotal,
    totalTax,
    grandTotal: Number(salesOrder.grand_total),

    remarks: salesOrder.remarks,
  };
};

// Then use it in your component
import { usePDFGeneration } from '../../hooks/usePDFGeneration';
import { convertSalesOrderToPDFData } from '../../utils/pdf/salesOrderToPDF';

export function SalesOrderPDFButton({ salesOrder }) {
  const { download, loading } = usePDFGeneration();

  const handleDownload = async () => {
    const pdfData = convertSalesOrderToPDFData(salesOrder);
    await download(pdfData, `SalesOrder-${salesOrder.order_no}.pdf`);
  };

  return (
    <button onClick={handleDownload} disabled={loading}>
      Download Sales Order PDF
    </button>
  );
}
```

## Example 6: PDF with Loading State and Error Handling

```typescript
import { useState } from 'react';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { Button, Alert, AlertDescription } from '@horizon-sync/ui/components';
import { usePDFGeneration } from '../../hooks/usePDFGeneration';
import { convertQuotationToPDFData } from '../../utils/pdf';

export function QuotationPDFDownload({ quotation }) {
  const { download, loading, error } = usePDFGeneration();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLocalError(null);
    try {
      const pdfData = convertQuotationToPDFData(quotation);
      await download(pdfData, `Quotation-${quotation.quotation_no}.pdf`);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to download PDF');
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleDownload}
        disabled={loading}
        variant="outline"
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating PDF...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </>
        )}
      </Button>

      {(error || localError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || localError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

## Example 7: PDF Preview Modal

```typescript
import { useState } from 'react';
import { Eye, X } from 'lucide-react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@horizon-sync/ui/components';
import { usePDFGeneration } from '../../hooks/usePDFGeneration';
import { convertQuotationToPDFData } from '../../utils/pdf';

export function QuotationPDFPreview({ quotation }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const { generateBlob, loading } = usePDFGeneration();

  const handlePreview = async () => {
    const pdfData = convertQuotationToPDFData(quotation);
    const blob = await generateBlob(pdfData);

    if (blob) {
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setPreviewOpen(true);
    }
  };

  const handleClose = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setPreviewOpen(false);
  };

  return (
    <>
      <Button onClick={handlePreview} disabled={loading} variant="outline">
        <Eye className="h-4 w-4 mr-2" />
        Preview PDF
      </Button>

      <Dialog open={previewOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>PDF Preview - {quotation.quotation_no}</DialogTitle>
          </DialogHeader>
          {pdfUrl && (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="PDF Preview"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

## Tips

1. **Always convert numeric values**: Use `Number()` to ensure values are numbers
2. **Handle missing data**: Provide fallbacks for optional fields
3. **Clean up resources**: Revoke object URLs when done
4. **Add loading states**: Show feedback during PDF generation
5. **Error handling**: Always wrap PDF operations in try-catch
6. **File naming**: Use descriptive, unique filenames
7. **Performance**: For bulk operations, add delays between generations
