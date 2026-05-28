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
  defaultAttachments?: Array<{ filename: string; content: string; content_type?: string }>;
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
  defaultAttachments,
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
      const allAttachments = data.attachments;

      const result = await sendEmail({
        to: data.to,
        cc: data.cc.length > 0 ? data.cc : undefined,
        subject: data.subject,
        message: data.message,
        attachments: allAttachments.length > 0 ? allAttachments : undefined,
        doc_type: docType,
        doc_id: docId,
        doc_no: docNo,
      });

      if (result.status === 'sent') {
        const toastPayload = {
          title: 'Email Sent',
          description: result.message || 'Email sent successfully',
        };
        toast(toastPayload);
        window.dispatchEvent(new CustomEvent('app:toast', { detail: toastPayload }));
        onSuccess?.(result.communication_id);
      } else if (result.status === 'disabled') {
        const toastPayload = {
          title: 'Email Service Disabled',
          description: result.message || 'Email service is not configured',
          variant: 'destructive' as const,
        };
        toast(toastPayload);
        window.dispatchEvent(new CustomEvent('app:toast', { detail: toastPayload }));
      } else {
        const toastPayload = {
          title: 'Failed to Send',
          description: result.message || 'Failed to send email',
          variant: 'destructive' as const,
        };
        toast(toastPayload);
        window.dispatchEvent(new CustomEvent('app:toast', { detail: toastPayload }));
      }
    } catch (error) {
      const toastPayload = {
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send email',
        variant: 'destructive' as const,
      };
      toast(toastPayload);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: toastPayload }));
      throw error;
    }
  };

  return (
    <EmailComposerDialog open={open}
      onOpenChange={onOpenChange}
      defaultRecipient={defaultRecipient}
      defaultSubject={defaultSubject}
      defaultMessage={defaultMessage}
      defaultAttachments={defaultAttachments}
      onSend={handleSend}
      sending={loading} />
  );
}
