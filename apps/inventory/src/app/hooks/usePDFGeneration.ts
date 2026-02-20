import { useState } from 'react';

import { generatePDFBase64, generatePDFBlob, downloadPDF, previewPDF } from '../utils/pdf/generatePDF';
import type { PDFDocumentData } from '../utils/pdf/types';

export const usePDFGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateBase64 = async (data: PDFDocumentData): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const base64 = await generatePDFBase64(data);
      return base64;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateBlob = async (data: PDFDocumentData): Promise<Blob | null> => {
    setLoading(true);
    setError(null);
    try {
      const blob = await generatePDFBlob(data);
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const download = async (data: PDFDocumentData, filename?: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await downloadPDF(data, filename);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download PDF';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const preview = async (data: PDFDocumentData): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await previewPDF(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to preview PDF';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    generateBase64,
    generateBlob,
    download,
    preview,
  };
};
