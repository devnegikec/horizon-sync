/**
 * Landing Page API Service
 *
 * Admin endpoints (auth required):
 *   GET    /api/v1/products/:productId/landing-page
 *   POST   /api/v1/products/:productId/landing-page
 *   PATCH  /api/v1/products/:productId/landing-page
 *   DELETE /api/v1/products/:productId/landing-page
 *   POST   /api/v1/products/:productId/landing-page/upload-image
 *
 * Public endpoint (no auth):
 *   GET    /api/v1/public/products/:productId/landing-page
 */

import { apiRequest } from '../utility/api/core';
import type {
  LandingPageConfigCreate,
  LandingPageConfigUpdate,
  LandingPageConfigResponse,
} from '../types/landing-page.types';

export const landingPageApi = {
  /**
   * Fetch the landing page configuration for a product (admin).
   * GET /api/v1/products/:productId/landing-page
   */
  get(accessToken: string, productId: string): Promise<LandingPageConfigResponse> {
    return apiRequest<LandingPageConfigResponse>(
      `/products/${productId}/landing-page`,
      accessToken,
    );
  },

  /**
   * Fetch the landing page configuration (public, no auth).
   * GET /api/v1/public/products/:productId/landing-page
   */
  getPublic(productId: string): Promise<LandingPageConfigResponse> {
    return apiRequest<LandingPageConfigResponse>(
      `/public/products/${productId}/landing-page`,
      undefined,
    );
  },

  /**
   * Create a new landing page configuration.
   * POST /api/v1/products/:productId/landing-page
   */
  create(
    accessToken: string,
    productId: string,
    data: LandingPageConfigCreate,
  ): Promise<LandingPageConfigResponse> {
    return apiRequest<LandingPageConfigResponse>(
      `/products/${productId}/landing-page`,
      accessToken,
      { method: 'POST', body: data },
    );
  },

  /**
   * Update an existing landing page configuration.
   * PATCH /api/v1/products/:productId/landing-page
   */
  update(
    accessToken: string,
    productId: string,
    data: LandingPageConfigUpdate,
  ): Promise<LandingPageConfigResponse> {
    return apiRequest<LandingPageConfigResponse>(
      `/products/${productId}/landing-page`,
      accessToken,
      { method: 'PATCH', body: data },
    );
  },

  /**
   * Delete the landing page configuration.
   * DELETE /api/v1/products/:productId/landing-page
   */
  delete(accessToken: string, productId: string): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(
      `/products/${productId}/landing-page`,
      accessToken,
      { method: 'DELETE' },
    );
  },

  /**
   * Upload an image (logo or banner) for the landing page.
   * POST /api/v1/products/:productId/landing-page/upload-image
   * Body: FormData with { file: File, type: 'logo' | 'banner' }
   */
  async uploadImage(
    accessToken: string,
    productId: string,
    file: File,
    type: 'logo' | 'banner',
  ): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return apiRequest<{ url: string }>(
      `/products/${productId}/landing-page/upload-image`,
      accessToken,
      { method: 'POST', body: formData },
    );
  },
};
