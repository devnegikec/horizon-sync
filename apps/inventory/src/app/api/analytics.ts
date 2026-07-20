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
} from '../types/qseal.types';
import { apiRequest, buildPaginationParams } from '../utility/api/core';

interface DateRange {
  date_from?: string;
  date_to?: string;
}

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
    return apiRequest<AnalyticsInteractionFunnel>('/analytics/scans/interaction-funnel', accessToken, { params: params as Record<string, string | undefined> });
  },

  // ── Geo ───────────────────────────────────────────────────
  getGeoHeatmap(accessToken: string, params?: DateRange & { limit?: number }): Promise<AnalyticsGeoPoint[]> {
    return apiRequest<AnalyticsGeoPoint[]>('/analytics/scans/geo-heatmap', accessToken, {
      params: { ...params, limit: params?.limit ?? 500 } as Record<string, string | number | undefined>,
    });
  },

  // ── Device Timeline ───────────────────────────────────────
  getDeviceTimeline(accessToken: string, params?: DateRange): Promise<AnalyticsDeviceTimeline[]> {
    return apiRequest<AnalyticsDeviceTimeline[]>('/analytics/scans/device-timeline', accessToken, { params: params as Record<string, string | undefined> });
  },

  // ── Scan Events Log ───────────────────────────────────────
  getScans(
    accessToken: string,
    page = 1,
    pageSize = 50,
    params?: DateRange & { serial_number?: string },
  ): Promise<AnalyticsScanListResponse> {
    return apiRequest<AnalyticsScanListResponse>('/analytics/scans', accessToken, {
      params: {
        ...buildPaginationParams(page, pageSize),
        ...params,
      } as Record<string, string | number | boolean | undefined>,
    });
  },
};
