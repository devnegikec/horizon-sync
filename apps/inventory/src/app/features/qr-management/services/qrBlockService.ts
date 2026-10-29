import axios from 'axios';

import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../../../environments/environment';
import type {
  ProductItem,
  QRBlock,
  QRBlockCreate,
  QRBlockListParams,
  QRBlockListResponse,
  QSealAggregationResponse,
  QSealAggregationGroupedResponse,
  QSealAutoLinkResponse,
  SerialCollisionCheckResponse,
} from '../types/qrBlock.types';

const API_BASE_URL = environment.apiCoreUrl;

class QRBlockService {
  private getHeaders() {
    const token = useUserStore.getState().accessToken;
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async createBlock(productId: string, data: QRBlockCreate): Promise<QRBlock> {
    const res = await axios.post(`${API_BASE_URL}/api/v1/qr-products/${productId}/blocks`, data, { headers: this.getHeaders() });
    return res.data;
  }

  async listBlocks(productId: string, params?: { page?: number; page_size?: number; status?: string }): Promise<QRBlockListResponse> {
    const res = await axios.get(`${API_BASE_URL}/api/v1/qr-products/${productId}/blocks`, { headers: this.getHeaders(), params });
    return res.data;
  }

  async getBlock(blockId: string): Promise<QRBlock> {
    const res = await axios.get(`${API_BASE_URL}/api/v1/qr-products/blocks/${blockId}`, { headers: this.getHeaders() });
    return res.data;
  }

  async retryBlock(blockId: string): Promise<QRBlock> {
    const res = await axios.post(`${API_BASE_URL}/api/v1/qr-products/blocks/${blockId}/retry`, {}, { headers: this.getHeaders() });
    return res.data;
  }

  async checkSerialCollisions(productId: string, startingSerial: string, quantity: number): Promise<SerialCollisionCheckResponse> {
    const res = await axios.get(`${API_BASE_URL}/api/v1/qr-products/blocks/serial-collision-check`, {
      headers: this.getHeaders(),
      params: {
        product_id: productId,
        starting_serial: startingSerial,
        quantity,
      },
    });
    return res.data;
  }

  async listAllBlocks(params?: QRBlockListParams): Promise<QRBlockListResponse> {
    const res = await axios.get(`${API_BASE_URL}/api/v1/qr-products/blocks`, { headers: this.getHeaders(), params });
    return res.data;
  }

  async getBlockItems(
    blockId: string,
    params?: { page?: number; page_size?: number; qr_active?: boolean },
  ): Promise<{ items: ProductItem[]; pagination: QRBlockListResponse['pagination'] }> {
    const res = await axios.get(`${API_BASE_URL}/api/v1/qr-products/blocks/${blockId}/items`, { headers: this.getHeaders(), params });
    return res.data;
  }

  async updateBlockItemStatus(blockId: string, itemId: string, active: boolean): Promise<ProductItem> {
    const res = await axios.patch(
      `${API_BASE_URL}/api/v1/qr-products/blocks/${blockId}/items/${itemId}/status`,
      { active },
      { headers: this.getHeaders() },
    );
    return res.data;
  }

  async updateBlockItemsStatus(blockId: string, itemIds: string[], active: boolean): Promise<{ updated_count: number; items: ProductItem[] }> {
    const res = await axios.patch(
      `${API_BASE_URL}/api/v1/qr-products/blocks/${blockId}/items/status`,
      { item_ids: itemIds, active },
      { headers: this.getHeaders() },
    );
    return res.data;
  }

  async getDownloadUrl(blockId: string): Promise<{ signed_url: string; expires_at: string }> {
    // Always fetch fresh — signed URLs expire
    const res = await axios.get(`${API_BASE_URL}/api/v1/qr-products/blocks/${blockId}/download`, { headers: this.getHeaders() });
    return res.data;
  }

  async autoLinkBlock(blockId: string, masterPackSize?: number): Promise<QSealAutoLinkResponse> {
    const res = await axios.post(
      `${API_BASE_URL}/api/v1/qseal/blocks/${blockId}/auto-link`,
      { master_pack_size: masterPackSize ?? null },
      { headers: this.getHeaders() },
    );
    return res.data;
  }

  async getAggregation(params?: { block_id?: string; page?: number; page_size?: number }): Promise<QSealAggregationResponse> {
    const res = await axios.get(`${API_BASE_URL}/api/v1/qseal/aggregation`, { headers: this.getHeaders(), params });
    return res.data;
  }

  async getAggregationGrouped(params?: { block_id?: string; page?: number; page_size?: number }): Promise<QSealAggregationGroupedResponse> {
    const res = await axios.get(`${API_BASE_URL}/api/v1/qseal/aggregation`, { headers: this.getHeaders(), params: { ...params, grouped: true } });
    return res.data;
  }

  // Public endpoint - no authentication required
  async authenticate(data: { serial_number: string; nonce: string; cipher: string }): Promise<{
    message: string;
    authentic: boolean;
    product_name: string | null;
    brand_name: string | null;
    gtin: string | null;
    serial_number: string | null;
  }> {
    const res = await axios.post(
      `${API_BASE_URL}/api/v1/qr-products/authenticate`,
      data,
      // NO AUTH HEADER - public endpoint
    );
    return res.data;
  }
}

export const qrBlockService = new QRBlockService();
