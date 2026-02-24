import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import type { Quotation } from '../types/quotation.types';
import { convertQuotationToPDFData } from '../utils/pdf/quotationToPDF';

import { usePDFGeneration } from './usePDFGeneration';

/**
 * Returns PDF/email actions that accept a quotation (for use from table row or detail dialog).
 */
export function useQuotationPDFActions() {
  const { toast } = useToast();
  const { loading, download, preview, generateBase64 } = usePDFGeneration();
  const organization = useUserStore((s) => s.organization);

  const handleDownload = React.useCallback(
    async (quotation: Quotation) => {
      try {
        const data = convertQuotationToPDFData(quotation, { organization });
        await download(data, `${quotation.quotation_no}.pdf`);
        toast({
          title: 'PDF Downloaded',
          description: `${quotation.quotation_no}.pdf has been downloaded`,
        });
      } catch (error) {
        toast({
          title: 'Download Failed',
          description: error instanceof Error ? error.message : 'Failed to download PDF',
          variant: 'destructive',
        });
      }
    },
    [download, organization, toast]
  );

  const handlePreview = React.useCallback(
    async (quotation: Quotation) => {
      try {
        const data = convertQuotationToPDFData(quotation, { organization });
        await preview(data);
      } catch (error) {
        toast({
          title: 'Preview Failed',
          description: error instanceof Error ? error.message : 'Failed to preview PDF',
          variant: 'destructive',
        });
      }
    },
    [preview, organization, toast]
  );

  const handleGenerateBase64 = React.useCallback(
    async (quotation: Quotation): Promise<string | null> => {
      try {
        const data = convertQuotationToPDFData(quotation, { organization });
        return await generateBase64(data);
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to prepare email',
          variant: 'destructive',
        });
        return null;
      }
    },
    [generateBase64, organization, toast]
  );

  return { loading, handleDownload, handlePreview, handleGenerateBase64 };
}
