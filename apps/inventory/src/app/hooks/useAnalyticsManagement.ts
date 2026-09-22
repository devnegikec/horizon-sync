import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import { analyticsApi } from '../api/analytics';
import type {
  AnalyticsFilters,
  AnalyticsSummary,
  AnalyticsCTABreakdown,
  AnalyticsInteractionFunnel,
  AnalyticsGeoPoint,
  AnalyticsDeviceTimeline,
  AnalyticsScanEvent,
  AnalyticsScanListResponse,
} from '../types/qseal.types';
import { getFriendlyErrorMessage } from '../utility/api/core';

function defaultDateRange(): { date_from: string; date_to: string } {
  const to = new Date();
  const from = new Date(Date.now() - 30 * 86400000);
  return {
    date_from: from.toISOString(),
    date_to: to.toISOString(),
  };
}

export interface UseAnalyticsManagementResult {
  // Filters
  filters: AnalyticsFilters;
  setFilters: React.Dispatch<React.SetStateAction<AnalyticsFilters>>;

  // Data
  summary: AnalyticsSummary | null;
  ctaBreakdown: AnalyticsCTABreakdown | null;
  interactionFunnel: AnalyticsInteractionFunnel | null;
  geoPoints: AnalyticsGeoPoint[];
  deviceTimeline: AnalyticsDeviceTimeline[];
  scanEvents: AnalyticsScanEvent[];
  scanPagination: AnalyticsScanListResponse['pagination'] | null;

  // Loading / Error
  loading: boolean;
  error: string | null;

  // Scan log pagination
  scanPage: number;
  setScanPage: (page: number) => void;

  // Actions
  refetch: () => void;
}

export function useAnalyticsManagement(): UseAnalyticsManagementResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [filters, setFilters] = React.useState<AnalyticsFilters>(defaultDateRange());

  // Data states
  const [summary, setSummary] = React.useState<AnalyticsSummary | null>(null);
  const [ctaBreakdown, setCTABreakdown] = React.useState<AnalyticsCTABreakdown | null>(null);
  const [interactionFunnel, setInteractionFunnel] = React.useState<AnalyticsInteractionFunnel | null>(null);
  const [geoPoints, setGeoPoints] = React.useState<AnalyticsGeoPoint[]>([]);
  const [deviceTimeline, setDeviceTimeline] = React.useState<AnalyticsDeviceTimeline[]>([]);
  const [scanEvents, setScanEvents] = React.useState<AnalyticsScanEvent[]>([]);
  const [scanPagination, setScanPagination] = React.useState<AnalyticsScanListResponse['pagination'] | null>(null);
  const [scanPage, setScanPage] = React.useState(1);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAll = React.useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { date_from, date_to } = filters;

    try {
      const [summaryData, ctaData, funnelData, geoData, deviceData] = await Promise.all([
        analyticsApi.getSummary(accessToken, { date_from, date_to }),
        analyticsApi.getCTABreakdown(accessToken, { date_from, date_to }),
        analyticsApi.getInteractionFunnel(accessToken, { date_from, date_to }),
        analyticsApi.getGeoHeatmap(accessToken, { date_from, date_to, limit: 500 }),
        analyticsApi.getDeviceTimeline(accessToken, { date_from, date_to }),
      ]);

      setSummary(summaryData);
      setCTABreakdown(ctaData);
      setInteractionFunnel(funnelData);
      setGeoPoints(geoData);
      setDeviceTimeline(Array.isArray(deviceData) ? deviceData : []);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters]);

  // Fetch scan events (paginated)
  const fetchScans = React.useCallback(async () => {
    if (!accessToken) return;

    const { date_from, date_to } = filters;

    try {
      const data = await analyticsApi.getScans(accessToken, scanPage, 20, { date_from, date_to });
      setScanEvents(data.events);
      setScanPagination(data.pagination);
    } catch (err) {
      console.error('Failed to fetch scan events:', err);
    }
  }, [accessToken, filters, scanPage]);

  // Fetch summary data on mount and when filters change
  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Fetch scan events separately (paginated)
  React.useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  const refetch = React.useCallback(() => {
    fetchAll();
    fetchScans();
  }, [fetchAll, fetchScans]);

  // Reset scan page to 1 when filters change
  React.useEffect(() => {
    setScanPage(1);
  }, [filters.date_from, filters.date_to]);

  return {
    filters,
    setFilters,
    summary,
    ctaBreakdown,
    interactionFunnel,
    geoPoints,
    deviceTimeline,
    scanEvents,
    scanPagination,
    loading,
    error,
    scanPage,
    setScanPage,
    refetch,
  };
}
