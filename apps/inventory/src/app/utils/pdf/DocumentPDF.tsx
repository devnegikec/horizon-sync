import * as React from 'react';

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

import type { PDFDocumentData } from './types';

// Register fonts if needed
// Font.register({ family: 'Roboto', src: 'path/to/font.ttf' });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
  },
  companySection: {
    marginBottom: 20,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    color: '#666',
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoBlock: {
    width: '48%',
  },
  infoLabel: {
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: '#f0f0f0',
    padding: '4 8',
    borderRadius: 4,
    fontSize: 8,
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 9,
    borderBottom: '1 solid #ddd',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #eee',
    fontSize: 9,
  },
  col1: { width: '5%' },
  col2: { width: '30%' },
  col3: { width: '10%', textAlign: 'right' },
  col4: { width: '10%' },
  col5: { width: '12%', textAlign: 'right' },
  col6: { width: '12%', textAlign: 'right' },
  col7: { width: '10%', textAlign: 'right' },
  col8: { width: '11%', textAlign: 'right' },
  itemName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  itemCode: {
    fontSize: 8,
    color: '#666',
  },
  taxInfo: {
    fontSize: 7,
    color: '#666',
    marginTop: 2,
  },
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '40%',
    padding: '4 0',
    fontSize: 9,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '40%',
    padding: '8 0',
    fontSize: 12,
    fontWeight: 'bold',
    borderTop: '2 solid #333',
    marginTop: 8,
  },
  taxSummarySection: {
    marginTop: 20,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  taxSummaryTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  taxSummaryItem: {
    marginBottom: 8,
  },
  taxSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  taxBreakup: {
    paddingLeft: 15,
    marginTop: 4,
  },
  taxBreakupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
  },
  remarksSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  remarksTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  remarksText: {
    fontSize: 9,
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
    borderTop: '1 solid #ddd',
    paddingTop: 10,
  },
});

interface DocumentPDFProps {
  data: PDFDocumentData;
}

export const DocumentPDF: React.FC<DocumentPDFProps> = ({ data }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `${data.currencySymbol} ${amount.toFixed(2)}`;
  };

  const getDocumentTitle = () => {
    switch (data.type) {
      case 'quotation':
        return 'Quotation';
      case 'sales_order':
        return 'Sales Order';
      case 'purchase_order':
        return 'Purchase Order';
      case 'invoice':
        return 'Invoice';
      default:
        return 'Document';
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Company Header */}
        <View style={styles.companySection}>
          <Text style={styles.companyName}>{data.companyName || 'Your Company Name'}</Text>
          {data.companyAddress && <Text style={styles.companyDetails}>{data.companyAddress}</Text>}
          {data.companyPhone && <Text style={styles.companyDetails}>Phone: {data.companyPhone}</Text>}
          {data.companyEmail && <Text style={styles.companyDetails}>Email: {data.companyEmail}</Text>}
        </View>

        {/* Document Title */}
        <Text style={styles.documentTitle}>{getDocumentTitle()}</Text>

        {/* Document Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Document Number</Text>
            <Text style={styles.infoValue}>{data.documentNo}</Text>

            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{formatDate(data.date)}</Text>

            {data.validUntil && (
              <>
                <Text style={styles.infoLabel}>Valid Until</Text>
                <Text style={styles.infoValue}>{formatDate(data.validUntil)}</Text>
              </>
            )}

            {data.dueDate && (
              <>
                <Text style={styles.infoLabel}>Due Date</Text>
                <Text style={styles.infoValue}>{formatDate(data.dueDate)}</Text>
              </>
            )}

            {data.status && (
              <>
                <Text style={styles.infoLabel}>Status</Text>
                <View style={styles.statusBadge}>
                  <Text>{data.status}</Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Customer</Text>
            <Text style={styles.infoValue}>{data.customerName}</Text>

            {data.customerCode && (
              <>
                <Text style={styles.infoLabel}>Customer Code</Text>
                <Text style={styles.infoValue}>{data.customerCode}</Text>
              </>
            )}

            {data.customerAddress && <Text style={styles.companyDetails}>{data.customerAddress}</Text>}
            {data.customerPhone && <Text style={styles.companyDetails}>Phone: {data.customerPhone}</Text>}
            {data.customerEmail && <Text style={styles.companyDetails}>Email: {data.customerEmail}</Text>}
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>#</Text>
            <Text style={styles.col2}>Item</Text>
            <Text style={styles.col3}>Qty</Text>
            <Text style={styles.col4}>UOM</Text>
            <Text style={styles.col5}>Rate</Text>
            <Text style={styles.col6}>Amount</Text>
            <Text style={styles.col7}>Tax</Text>
            <Text style={styles.col8}>Total</Text>
          </View>

          {data.lineItems.map((item) => (
            <View key={item.index} style={styles.tableRow}>
              <Text style={styles.col1}>{item.index}</Text>
              <View style={styles.col2}>
                <Text style={styles.itemName}>{item.itemName}</Text>
                {item.itemCode && <Text style={styles.itemCode}>{item.itemCode}</Text>}
                {item.taxInfo && (
                  <Text style={styles.taxInfo}>
                    {item.taxInfo.breakup.map((tax) => `${tax.rule_name} ${tax.rate}%`).join(', ')}
                  </Text>
                )}
              </View>
              <Text style={styles.col3}>{item.quantity.toFixed(3)}</Text>
              <Text style={styles.col4}>{item.uom}</Text>
              <Text style={styles.col5}>{formatCurrency(item.rate)}</Text>
              <Text style={styles.col6}>{formatCurrency(item.amount)}</Text>
              <Text style={styles.col7}>{item.taxAmount ? formatCurrency(item.taxAmount) : '—'}</Text>
              <Text style={styles.col8}>{formatCurrency(item.totalAmount)}</Text>
            </View>
          ))}
        </View>

        {/* Tax Summary */}
        {data.taxSummary && data.taxSummary.length > 0 && (
          <View style={styles.taxSummarySection}>
            <Text style={styles.taxSummaryTitle}>Tax Summary</Text>
            {data.taxSummary.map((tax, index) => (
              <View key={index} style={styles.taxSummaryItem}>
                <View style={styles.taxSummaryRow}>
                  <Text>{tax.name}</Text>
                  <Text>{formatCurrency(tax.amount)}</Text>
                </View>
                <View style={styles.taxBreakup}>
                  {tax.breakup.map((breakup, idx) => (
                    <View key={idx} style={styles.taxBreakupRow}>
                      <Text>
                        {breakup.rule_name} ({breakup.rate}%)
                      </Text>
                      <Text>{formatCurrency(breakup.amount)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>{formatCurrency(data.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Total Tax:</Text>
            <Text>{formatCurrency(data.totalTax)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text>Grand Total:</Text>
            <Text>{formatCurrency(data.grandTotal)}</Text>
          </View>
        </View>

        {/* Remarks */}
        {data.remarks && (
          <View style={styles.remarksSection}>
            <Text style={styles.remarksTitle}>Remarks</Text>
            <Text style={styles.remarksText}>{data.remarks}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Generated on {new Date().toLocaleDateString('en-US')} | {data.companyName || 'Your Company'}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
