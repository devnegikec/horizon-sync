import { apiRequest } from './core';
import type {
  AllocationSuggestionResponse,
  SmartPickListCreate,
  SmartPickListResponse,
  DeliveryNoteFromPickListRequest,
  DeliveryNoteFromPickListResponse,
} from '../../types/smart-picking.types';

export const smartPickingApi = {
  suggestAllocation: (accessToken: string, salesOrderId: string) =>
    apiRequest<AllocationSuggestionResponse>(
      `/smart-picking/suggest-allocation/${salesOrderId}`,
      accessToken,
    ),

  createPickList: (accessToken: string, data: SmartPickListCreate) =>
    apiRequest<SmartPickListResponse>('/smart-picking/create', accessToken, {
      method: 'POST',
      body: data,
    }),

  createDeliveryFromPickList: (accessToken: string, data: DeliveryNoteFromPickListRequest) =>
    apiRequest<DeliveryNoteFromPickListResponse>(
      '/smart-picking/delivery-from-pick-list',
      accessToken,
      { method: 'POST', body: data },
    ),
};
