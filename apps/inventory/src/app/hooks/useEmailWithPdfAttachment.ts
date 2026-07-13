import { useState } from 'react';

import { useToast } from '@horizon-sync/ui/hooks/use-toast';

interface PdfAttachment {
  filename: string;
  content: string;
  content_type: string;
}

interface UseEmailWithPdfAttachmentOptions {
  generateBase64: () => Promise<string | null>;
  filename: string;
}

export function useEmailWithPdfAttachment() {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [pdfAttachment, setPdfAttachment] = useState<PdfAttachment | null>(null);
  const { toast } = useToast();

  const openEmailWithPdf = async (generateBase64: () => Promise<string | null>, filename: string) => {
    const base64Content = await generateBase64();
    if (base64Content) {
      setPdfAttachment({ filename, content: base64Content, content_type: 'application/pdf' });
      setEmailDialogOpen(true);
    } else {
      toast({ title: 'PDF Generation Failed', description: 'Could not generate PDF attachment', variant: 'destructive' });
    }
  };

  const handleEmailClose = (isOpen: boolean) => {
    setEmailDialogOpen(isOpen);
    if (!isOpen) setPdfAttachment(null);
  };

  const handleEmailSuccess = () => {
    setEmailDialogOpen(false);
    setPdfAttachment(null);
  };

  return { emailDialogOpen, pdfAttachment, openEmailWithPdf, handleEmailClose, handleEmailSuccess };
}
