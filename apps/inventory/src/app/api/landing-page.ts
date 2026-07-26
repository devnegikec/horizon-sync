/**
 * Landing Page API Service (STUB — Backend APIs not yet implemented)
 *
 * Sample API Contract
 * ===================
 *
 * GET    /api/v1/products/:productId/landing-page
 *   → LandingPageConfigResponse { config: LandingPageConfig }
 *
 * POST   /api/v1/products/:productId/landing-page
 *   ← LandingPageConfigCreate
 *   → LandingPageConfigResponse
 *
 * PATCH  /api/v1/products/:productId/landing-page
 *   ← LandingPageConfigUpdate
 *   → LandingPageConfigResponse
 *
 * DELETE /api/v1/products/:productId/landing-page
 *   → { success: true }
 *
 * POST   /api/v1/products/:productId/landing-page/upload-image
 *   ← FormData { file: File, type: 'logo' | 'banner' }
 *   → { url: string }
 */

import type {
  LandingPageConfig,
  LandingPageConfigCreate,
  LandingPageConfigUpdate,
  LandingPageConfigResponse,
} from '../types/landing-page.types';

export const landingPageApi = {
  /**
   * Fetch the landing page configuration for a product.
   * GET /api/v1/products/:productId/landing-page
   */
  async get(_accessToken: string, _productId: string): Promise<LandingPageConfigResponse> {
    throw new Error('API not implemented');
  },

  /**
   * Create a new landing page configuration.
   * POST /api/v1/products/:productId/landing-page
   */
  async create(
    _accessToken: string,
    _productId: string,
    _data: LandingPageConfigCreate,
  ): Promise<LandingPageConfigResponse> {
    throw new Error('API not implemented');
  },

  /**
   * Update an existing landing page configuration.
   * PATCH /api/v1/products/:productId/landing-page
   */
  async update(
    _accessToken: string,
    _productId: string,
    _data: LandingPageConfigUpdate,
  ): Promise<LandingPageConfigResponse> {
    throw new Error('API not implemented');
  },

  /**
   * Delete the landing page configuration.
   * DELETE /api/v1/products/:productId/landing-page
   */
  async delete(_accessToken: string, _productId: string): Promise<void> {
    throw new Error('API not implemented');
  },

  /**
   * Upload an image (logo or banner) for the landing page.
   * POST /api/v1/products/:productId/landing-page/upload-image
   * Body: FormData with { file: File, type: 'logo' | 'banner' }
   */
  async uploadImage(
    _accessToken: string,
    _productId: string,
    _file: File,
    _type: 'logo' | 'banner',
  ): Promise<{ url: string }> {
    throw new Error('API not implemented');
  },
};

/**
 * ─── SAMPLE API CONTRACT (for backend team) ─────────────────────────────────
 *
 * Request/Response Examples:
 *
 * POST /api/v1/products/prod_123/landing-page
 * Request Body:
 * {
 *   "logo_url": "https://cdn.example.com/logo.png",
 *   "banner_image_url": "https://cdn.example.com/banner.png",
 *   "primary_color": "#1a56db",
 *   "accent_color": "#f59e0b",
 *   "product_details": {
 *     "show_gtin": true,
 *     "show_batch": true,
 *     "show_mfg_date": true,
 *     "show_expiry_date": true,
 *     "show_serial_number": false,
 *     "custom_fields": [
 *       { "label": "Net Weight", "value": "500mg" }
 *     ]
 *   },
 *   "social_links": [
 *     { "platform": "facebook", "url": "https://fb.com/brand", "enabled": true, "sort_order": 0 },
 *     { "platform": "instagram", "url": "https://instagram.com/brand", "enabled": true, "sort_order": 1 }
 *   ],
 *   "feedback": {
 *     "enabled": true,
 *     "type": "survey",
 *     "title": "Share Your Feedback",
 *     "description": "Help us improve our products",
 *     "survey_url": "https://forms.example.com/survey",
 *     "thank_you_message": "Thank you for your feedback!"
 *   },
 *   "warranty": {
 *     "enabled": true,
 *     "title": "Product Warranty",
 *     "description": "This product is covered under our 2-year warranty program.",
 *     "cta_text": "Register Warranty",
 *     "cta_url": "https://example.com/warranty"
 *   },
 *   "custom_cta": {
 *     "enabled": true,
 *     "button_text": "Buy Again",
 *     "button_url": "https://shop.example.com/reorder",
 *     "button_style": "primary"
 *   },
 *   "footer": {
 *     "text": "© 2026 Your Company. All rights reserved.",
 *     "show_powered_by": true,
 *     "custom_links": [
 *       { "label": "Privacy Policy", "url": "/privacy" },
 *       { "label": "Terms of Service", "url": "/terms" }
 *     ]
 *   }
 * }
 *
 * Response (201):
 * {
 *   "config": {
 *     "product_id": "prod_123",
 *     "organization_id": "org_456",
 *     "logo_url": "https://cdn.example.com/logo.png",
 *     ... (full config returned)
 *     "created_at": "2026-07-26T10:00:00Z",
 *     "updated_at": "2026-07-26T10:00:00Z"
 *   }
 * }
 */
