import * as React from 'react';

import { pdf } from '@react-pdf/renderer';

import { DocumentPDF } from './DocumentPDF';
import type { PDFDocumentData } from './types';

/**
 * Generate PDF blob from document data
 */
export const generatePDFBlob = async (data: PDFDocumentData): Promise<Blob> => {
  const blob = await pdf(<DocumentPDF data={data} />).toBlob();
  return blob;
};

/**
 * Generate base64 encoded PDF string from document data
 */
export const generatePDFBase64 = async (data: PDFDocumentData): Promise<string> => {
  const blob = await generatePDFBlob(data);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Download PDF file
 */
export const downloadPDF = async (data: PDFDocumentData, filename?: string): Promise<void> => {
  const blob = await generatePDFBlob(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${data.documentNo}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Open PDF in new tab for preview
 */
export const previewPDF = async (data: PDFDocumentData): Promise<void> => {
  const blob = await generatePDFBlob(data);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};
