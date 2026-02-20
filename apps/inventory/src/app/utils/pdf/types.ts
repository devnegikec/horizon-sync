// Common types for PDF generation

export interface PDFDocumentData {
  type: 'quotation' | 'sales_order' | 'purchase_order' | 'invoice';
  documentNo: string;
  date: string;
  validUntil?: string;
  dueDate?: string;
  currency: string;
  currencySymbol: string;
  status?: string;
  
  // Company/Organization info
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLogo?: string;
  
  // Customer/Supplier info
  customerName: string;
  customerCode?: string;
  customerAddress?: string;
  customerPhone?: string;
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
  
  // Additional info
  remarks?: string;
  termsAndConditions?: string;
}

export interface PDFLineItem {
  index: number;
  itemName: string;
  itemCode?: string;
  quantity: number;
  uom: string;
  rate: number;
  amount: number;
  taxAmount?: number;
  totalAmount: number;
  taxInfo?: {
    templateName: string;
    breakup: Array<{
      rule_name: string;
      rate: number;
    }>;
  };
}
