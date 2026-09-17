/**
 * Analytics API service
 * Endpoints: /api/v1/analytics
 */

import type {
  AnalyticsSummary,
  AnalyticsCTABreakdown,
  AnalyticsInteractionFunnel,
  AnalyticsGeoPoint,
  AnalyticsDeviceTimeline,
  AnalyticsScanListResponse,
  AnalyticsFilters,
  QSealAnalyticsHistoryResponse,
  QSealAnalyticsSummary,
  QSealDeviceAnalyticsItem,
  QSealGeographyAnalyticsItem,
  QSealProductAnalyticsItem,
  QSealBlockOption,
  QSealScanTrendItem,
  QSealSuspiciousReviewStatus,
  QSealSuspiciousScanResponse,
} from '../types/qseal.types';
import { apiRequest, buildPaginationParams } from '../utility/api/core';

interface DateRange {
  date_from?: string;
  date_to?: string;
}

type QSealAnalyticsParams = AnalyticsFilters & { limit?: number };

export const analyticsApi = {
  // ── Overview Dashboard ────────────────────────────────────
  getSummary(accessToken: string, params?: DateRange & { serial_number?: string }): Promise<AnalyticsSummary> {
    return apiRequest<AnalyticsSummary>('/analytics/scans/summary', accessToken, { params: params as Record<string, string | undefined> });
  },

  // ── CTA & Funnel ──────────────────────────────────────────
  getCTABreakdown(accessToken: string, params?: DateRange): Promise<AnalyticsCTABreakdown> {
    return apiRequest<AnalyticsCTABreakdown>('/analytics/scans/cta-breakdown', accessToken, { params: params as Record<string, string | undefined> });
  },

  getInteractionFunnel(accessToken: string, params?: DateRange): Promise<AnalyticsInteractionFunnel> {
    return apiRequest<AnalyticsInteractionFunnel>('/analytics/scans/interaction-funnel', accessToken, {
      params: params as Record<string, string | undefined>,
    });
  },

  // ── Geo ───────────────────────────────────────────────────
  async getGeoHeatmap(accessToken: string, params?: DateRange & { limit?: number }): Promise<AnalyticsGeoPoint[]> {
    const res = await apiRequest<{ points: AnalyticsGeoPoint[] }>('/analytics/scans/geo-heatmap', accessToken, {
      params: { ...params, limit: params?.limit ?? 500 } as Record<string, string | number | undefined>,
    });
    return res.points || [];
  },

  // ── Device Timeline ───────────────────────────────────────
  async getDeviceTimeline(accessToken: string, params?: DateRange): Promise<AnalyticsDeviceTimeline[]> {
    const res = await apiRequest<{ timeline: AnalyticsDeviceTimeline[] }>('/analytics/scans/device-timeline', accessToken, {
      params: params as Record<string, string | undefined>,
    });
    return res.timeline || [];
  },

  // ── Scan Events Log ───────────────────────────────────────
  getScans(accessToken: string, page = 1, pageSize = 50, params?: DateRange & { serial_number?: string }): Promise<AnalyticsScanListResponse> {
    return apiRequest<AnalyticsScanListResponse>('/analytics/scans', accessToken, {
      params: {
        ...buildPaginationParams(page, pageSize),
        ...params,
      } as Record<string, string | number | boolean | undefined>,
    });
  },

  // ── Client-facing QSeal Analytics ─────────────────────────
  getQSealSummary(accessToken: string, params?: QSealAnalyticsParams): Promise<QSealAnalyticsSummary> {
    return apiRequest<QSealAnalyticsSummary>('/qseal/analytics/summary', accessToken, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  },

  async getQSealTrends(accessToken: string, params?: QSealAnalyticsParams): Promise<QSealScanTrendItem[]> {
    const response = await apiRequest<{ items: QSealScanTrendItem[] }>('/qseal/analytics/trends', accessToken, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
    return response.items || [];
  },

  async getQSealProducts(accessToken: string, params?: QSealAnalyticsParams): Promise<QSealProductAnalyticsItem[]> {
    const response = await apiRequest<{ items: QSealProductAnalyticsItem[] }>('/qseal/analytics/products', accessToken, {
      params: { ...params, limit: params?.limit ?? 100 },
    });
    return response.items || [];
  },

  async getQSealGeography(accessToken: string, params?: QSealAnalyticsParams): Promise<QSealGeographyAnalyticsItem[]> {
    const response = await apiRequest<{ items: QSealGeographyAnalyticsItem[] }>('/qseal/analytics/geography', accessToken, {
      params: { ...params, limit: params?.limit ?? 500 },
    });
    return response.items || [];
  },

  async getQSealDevices(accessToken: string, params?: QSealAnalyticsParams): Promise<QSealDeviceAnalyticsItem[]> {
    const response = await apiRequest<{ items: QSealDeviceAnalyticsItem[] }>('/qseal/analytics/devices', accessToken, {
      params: { ...params, limit: params?.limit ?? 100 },
    });
    return response.items || [];
  },

  async getQSealBlocks(accessToken: string): Promise<QSealBlockOption[]> {
    const response = await apiRequest<{ blocks: QSealBlockOption[] }>('/qr-products/blocks', accessToken, {
      params: { page: 1, page_size: 100 },
    });
    return response.blocks || [];
  },

  getQSealHistory(accessToken: string, page = 1, pageSize = 50, params?: QSealAnalyticsParams): Promise<QSealAnalyticsHistoryResponse> {
    return apiRequest<QSealAnalyticsHistoryResponse>('/qseal/history', accessToken, {
      params: { page, page_size: pageSize, ...params },
    });
  },

  getQSealSuspicious(accessToken: string, page = 1, pageSize = 50, params?: QSealAnalyticsParams & { review_status?: string; min_risk_score?: number }): Promise<QSealSuspiciousScanResponse> {
    return apiRequest<QSealSuspiciousScanResponse>('/qseal/analytics/suspicious', accessToken, {
      params: { page, page_size: pageSize, ...params } as Record<string, string | number | boolean | undefined>,
    });
  },

  reviewQSealSuspicious(accessToken: string, eventId: string, review_status: QSealSuspiciousReviewStatus): Promise<unknown> {
    return apiRequest(`/qseal/analytics/suspicious/${eventId}`, accessToken, {
      method: 'PATCH',
      body: { review_status },
    });
  },
};
