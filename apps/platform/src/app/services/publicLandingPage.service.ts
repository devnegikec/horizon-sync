import axios from 'axios';

import { environment } from '../../environments/environment';
import type {
  PublicLandingPageConfig,
  PublicLandingPageResponse,
} from '../types/public-landing-page.types';

const API_BASE_URL = environment.apiCoreUrl;

export async function getPublicLandingPageBySku(sku: string): Promise<PublicLandingPageConfig> {
  const response = await axios.get<PublicLandingPageResponse>(
    `${API_BASE_URL}/api/v1/public/products/sku/${encodeURIComponent(sku)}/landing-page`,
  );
  return response.data.config;
}
