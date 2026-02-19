import * as React from 'react';

import { EmailComposerDialog } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { useSendEmail } from '../../hooks/useSendEmail';
import type { DocType } from '../../types/communication.types';

export interface EmailComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docType?: DocType;
  docId?: string;
  docNo?: string;
  defaultRecipient?: string;
  defaultSubject?: string;
  defaultMessage?: string;
  onSuccess?: (communicationId: string | null) => void;
}

export function EmailComposer({
  open,
  onOpenChange,
  docType,
  docId,
  docNo,
  defaultRecipient,
  defaultSubject,
  defaultMessage,
  onSuccess,
}: EmailComposerProps) {
  const { toast } = useToast();
  const { sendEmail, loading } = useSendEmail();

  const handleSend = async (data: {
    to: string;
    cc: string[];
    subject: string;
    message: string;
    attachments: Array<{ filename: string; content: string; content_type?: string }>;
  }) => {
    try {
      const result = await sendEmail({
        to: data.to,
        cc: data.cc.length > 0 ? data.cc : undefined,
        subject: data.subject,
        message: data.message,
        attachments: data.attachments.length > 0 ? data.attachments : undefined,
        doc_type: docType,
        doc_id: docId,
        doc_no: docNo,
      });

      if (result.status === 'sent') {
        toast({
          title: 'Email Sent',
          description: result.message || 'Email sent successfully',
        });
        onSuccess?.(result.communication_id);
      } else if (result.status === 'disabled') {
        toast({
          title: 'Email Service Disabled',
          description: result.message || 'Email service is not configured',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to Send',
          description: result.message || 'Failed to send email',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send email',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <EmailComposerDialog
      open={open}
      onOpenChange={onOpenChange}
      defaultRecipient={defaultRecipient}
      defaultSubject={defaultSubject}
      defaultMessage={defaultMessage}
      onSend={handleSend}
      sending={loading}
    />
  );
}
