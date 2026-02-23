import type { Organization } from '@horizon-sync/store';

import { SUPPORTED_CURRENCIES } from '../../types/currency.types';
import type { Quotation, CustomerInfo } from '../../types/quotation.types';

import type { PDFDocumentData, PDFLineItem } from './types';

interface OrgContext {
  organization: Organization | null;
}

interface OrgAddress {
  street_address?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  tax_id?: string;
}

function formatCustomerAddress(customer: CustomerInfo): string {
  return [
    customer.address_line1,
    customer.address_line2,
    customer.city,
    customer.state,
    customer.postal_code,
    customer.country,
  ].filter(Boolean).join(', ');
}

function getOrgAddress(organization: Organization): OrgAddress {
  const settings = organization.settings as Record<string, unknown> | null;
  return (settings?.address as OrgAddress | undefined) ?? {};
}

function buildCompanyInfo(organization: Organization | null) {
  if (!organization) {
    return { companyName: 'Your Company', companyAddress: '', companyPhone: '', companyEmail: '', companyTaxId: '' };
  }
  const addr = getOrgAddress(organization);
  const addressParts = [addr.street_address, addr.city, addr.state_province, addr.postal_code, addr.country].filter(Boolean);
  return {
    companyName: organization.display_name || organization.name,
    companyAddress: addressParts.join(', '),
    companyPhone: addr.phone ?? '',
    companyEmail: addr.email ?? '',
    companyTaxId: addr.tax_id ?? '',
  };
}

function buildTaxSummary(lineItems: Quotation['items']) {
  const taxSummary = new Map<string, { name: string; amount: number; breakup: Array<{ rule_name: string; rate: number; amount: number }> }>();
  (lineItems ?? []).forEach((item) => {
    if (!item.tax_info) return;
    const key = item.tax_info.template_code;
    if (!taxSummary.has(key)) {
      taxSummary.set(key, {
        name: item.tax_info.template_name,
        amount: 0,
        breakup: item.tax_info.breakup.map((t) => ({ rule_name: t.rule_name, rate: t.rate, amount: 0 })),
      });
    }
    const summary = taxSummary.get(key);
    if (summary) {
      summary.amount += Number(item.tax_amount || 0);
      item.tax_info.breakup.forEach((t, idx) => {
        summary.breakup[idx].amount += (Number(item.amount) * t.rate) / 100;
      });
    }
  });
  return Array.from(taxSummary.values());
}

function toLineItem(item: NonNullable<Quotation['items']>[number], index: number): PDFLineItem {
  return {
    index: index + 1,
    itemName: item.item_name || '',
    itemCode: item.item_code || item.item_sku,
    quantity: Number(item.qty),
    uom: item.uom,
    rate: Number(item.rate),
    amount: Number(item.amount),
    taxAmount: item.tax_amount ? Number(item.tax_amount) : undefined,
    totalAmount: Number(item.total_amount || item.amount),
    taxInfo: item.tax_info
      ? { templateName: item.tax_info.template_name, breakup: item.tax_info.breakup.map((t) => ({ rule_name: t.rule_name, rate: t.rate })) }
      : undefined,
  };
}

function getCurrencySymbol(code: string): string {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code)?.symbol || code;
}

function buildCustomerFields(quotation: Quotation) {
  const customer = quotation.customer;
  return {
    customerName: quotation.customer_name || customer?.name || 'N/A',
    customerCode: customer?.code,
    customerAddress: customer ? formatCustomerAddress(customer) : '',
    customerPhone: customer?.phone,
    customerEmail: customer?.email,
    customerTaxNumber: customer?.tax_number,
  };
}

export function convertQuotationToPDFData(quotation: Quotation, orgContext?: OrgContext): PDFDocumentData {
  const lineItems = quotation.items || quotation.line_items || [];
  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalTax = lineItems.reduce((sum, item) => sum + Number(item.tax_amount || 0), 0);
  const company = buildCompanyInfo(orgContext?.organization ?? null);

  return {
    type: 'quotation',
    documentNo: quotation.quotation_no,
    date: quotation.quotation_date,
    validUntil: quotation.valid_until,
    currency: quotation.currency,
    currencySymbol: getCurrencySymbol(quotation.currency),
    status: quotation.status,
    ...company,
    ...buildCustomerFields(quotation),
    lineItems: lineItems.map(toLineItem),
    subtotal,
    totalTax,
    grandTotal: Number(quotation.grand_total),
    taxSummary: buildTaxSummary(lineItems),
    remarks: quotation.remarks,
  };
}
