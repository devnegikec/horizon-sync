export type DocType =
  | 'quotation'
  | 'sales_order'
  | 'purchase_order'
  | 'invoice'
  | 'delivery_note'
  | 'purchase_receipt'
  | 'payment'
  | 'rfq'
  | 'material_request';

export type CommunicationChannel = 'email' | 'whatsapp' | 'sms' | 'webhook';

export type CommunicationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';

export interface EmailAttachment {
  filename: string;
  content: string; // base64 encoded
  content_type?: string;
}

export interface SendEmailRequest {
  to: string;
  cc?: string[];
  subject: string;
  message: string;
  html_message?: string;
  attachments?: EmailAttachment[];
  doc_type?: DocType;
  doc_id?: string;
  doc_no?: string;
}

export interface SendEmailResponse {
  status: 'sent' | 'failed' | 'disabled';
  message: string;
  communication_id: string | null;
}

export interface Communication {
  id: string;
  organization_id: string;
  doc_type: DocType;
  doc_id: string;
  doc_no: string | null;
  version: number;
  channel: CommunicationChannel;
  recipient_type: string | null;
  recipient: string;
  recipient_name: string | null;
  sender_id: string;
  sender_name: string | null;
  sender_email: string | null;
  subject: string | null;
  message: string | null;
  status: CommunicationStatus;
  sent_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  error_message: string | null;
  extra_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CommunicationListItem {
  id: string;
  organization_id: string;
  doc_type: DocType;
  doc_id: string;
  doc_no: string | null;
  version: number;
  channel: CommunicationChannel;
  recipient_type: string | null;
  recipient: string;
  recipient_name: string | null;
  status: CommunicationStatus;
  sent_at: string | null;
  created_at: string;
}

export interface CommunicationListResponse {
  communications: CommunicationListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}
