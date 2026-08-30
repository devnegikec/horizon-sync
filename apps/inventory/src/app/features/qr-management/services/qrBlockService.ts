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
  QSealAutoLinkResponse,
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
    const res = await axios.post(
      `${API_BASE_URL}/api/v1/qr-products/${productId}/blocks`,
      data,
      { headers: this.getHeaders() },
    );
    return res.data;
  }

  async listBlocks(
    productId: string,
    params?: { page?: number; page_size?: number; status?: string },
  ): Promise<QRBlockListResponse> {
    const res = await axios.get(
      `${API_BASE_URL}/api/v1/qr-products/${productId}/blocks`,
      { headers: this.getHeaders(), params },
    );
    return res.data;
  }

  async getBlock(blockId: string): Promise<QRBlock> {
    const res = await axios.get(
      `${API_BASE_URL}/api/v1/qr-products/blocks/${blockId}`,
      { headers: this.getHeaders() },
    );
    return res.data;
  }

  async retryBlock(blockId: string): Promise<QRBlock> {
    const res = await axios.post(
      `${API_BASE_URL}/api/v1/qr-products/blocks/${blockId}/retry`,
      {},
      { headers: this.getHeaders() },
    );
    return res.data;
  }

  async listAllBlocks(params?: QRBlockListParams): Promise<QRBlockListResponse> {
    const res = await axios.get(
      `${API_BASE_URL}/api/v1/qr-products/blocks`,
      { headers: this.getHeaders(), params },
    );
    return res.data;
  }

  async getBlockItems(
    blockId: string,
    params?: { page?: number; page_size?: number },
  ): Promise<{ items: ProductItem[]; pagination: QRBlockListResponse['pagination'] }> {
    const res = await axios.get(
      `${API_BASE_URL}/api/v1/qr-products/blocks/${blockId}/items`,
      { headers: this.getHeaders(), params },
    );
    return res.data;
  }

  async getDownloadUrl(blockId: string): Promise<{ signed_url: string; expires_at: string }> {
    // Always fetch fresh — signed URLs expire
    const res = await axios.get(
      `${API_BASE_URL}/api/v1/qr-products/blocks/${blockId}/download`,
      { headers: this.getHeaders() },
    );
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

  async getAggregation(params?: {
    block_id?: string;
    page?: number;
    page_size?: number;
  }): Promise<QSealAggregationResponse> {
    const res = await axios.get(
      `${API_BASE_URL}/api/v1/qseal/aggregation`,
      { headers: this.getHeaders(), params },
    );
    return res.data;
  }

  // Public endpoint - no authentication required
  async authenticate(data: {
    serial_number: string;
    nonce: string;
    cipher: string;
  }): Promise<{
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
