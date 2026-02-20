import type { CommunicationListResponse, SendEmailRequest, SendEmailResponse, Communication } from '../../types/communication.types';

import { apiRequest, buildPaginationParams } from './core';

export const communicationApi = {
  sendEmail: (accessToken: string, data: SendEmailRequest): Promise<SendEmailResponse> =>
    apiRequest('/communications/send', accessToken, {
      method: 'POST',
      body: data,
    }),

  list: (
    accessToken: string,
    page = 1,
    pageSize = 20,
    filters?: {
      doc_type?: string;
      doc_id?: string;
      channel?: string;
      status?: string;
      recipient_type?: string;
    }
  ): Promise<CommunicationListResponse> =>
    apiRequest('/communications', accessToken, {
      params: {
        ...buildPaginationParams(page, pageSize),
        doc_type: filters?.doc_type,
        doc_id: filters?.doc_id,
        channel: filters?.channel,
        status: filters?.status,
        recipient_type: filters?.recipient_type,
      },
    }),

  get: (accessToken: string, id: string): Promise<Communication> =>
    apiRequest(`/communications/${id}`, accessToken),

  delete: (accessToken: string, id: string): Promise<void> =>
    apiRequest(`/communications/${id}`, accessToken, {
      method: 'DELETE',
    }),
};
