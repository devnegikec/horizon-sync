import axios from 'axios';

import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../../../environments/environment';
import type { Brand, BrandCreate, BrandUpdate, BrandListResponse } from '../types/brand.types';

const API_BASE_URL = environment.apiCoreUrl;

class BrandService {
  private getHeaders() {
    const token = useUserStore.getState().accessToken;
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    };
  }

  async create(data: BrandCreate): Promise<Brand> {
    const res = await axios.post(`${API_BASE_URL}/api/v1/brands`, data, { headers: this.getHeaders() });
    return res.data;
  }

  async list(params?: { page?: number; page_size?: number; search?: string }): Promise<BrandListResponse> {
    const res = await axios.get(`${API_BASE_URL}/api/v1/brands`, { headers: this.getHeaders(), params });
    return res.data;
  }

  async getById(id: string): Promise<Brand> {
    const res = await axios.get(`${API_BASE_URL}/api/v1/brands/${id}`, { headers: this.getHeaders() });
    return res.data;
  }

  async update(id: string, data: BrandUpdate): Promise<Brand> {
    const { name, short_code } = data;
    const res = await axios.patch(
      `${API_BASE_URL}/api/v1/brands/${id}`,
      { name, short_code },
      { headers: this.getHeaders() },
    );
    return res.data;
  }
}

export const brandService = new BrandService();
