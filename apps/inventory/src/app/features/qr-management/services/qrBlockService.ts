import axios from 'axios';

import { environment } from '../../../../environments/environment';
import type { QRBlock, QRBlockCreate, QRBlockListResponse } from '../types/qrBlock.types';

const API_BASE_URL = environment.apiCoreUrl;

class QRBlockService {
  private getHeaders() {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
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
}

export const qrBlockService = new QRBlockService();
