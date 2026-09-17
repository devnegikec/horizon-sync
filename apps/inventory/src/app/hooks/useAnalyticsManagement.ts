import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import { analyticsApi } from '../api/analytics';
import { qrProductApi } from '../api/qr-products';
import { featureFlagApi } from '../utility/api/feature-flags';
import type {
  AnalyticsFilters,
  QSealAnalyticsHistoryItem,
  QSealAnalyticsHistoryResponse,
  QSealAnalyticsSummary,
  QSealBlockOption,
  QSealDeviceAnalyticsItem,
  QSealGeographyAnalyticsItem,
  QSealProductAnalyticsItem,
  QSealProductListItem,
  QSealScanTrendItem,
  QSealSuspiciousReviewStatus,
} from '../types/qseal.types';
import { getFriendlyErrorMessage } from '../utility/api/core';

function defaultDateRange(): Pick<AnalyticsFilters, 'date_from' | 'date_to'> {
  const to = new Date();
  const from = new Date(Date.now() - 30 * 86400000);
  return { date_from: from.toISOString(), date_to: to.toISOString() };
}

export interface UseAnalyticsManagementResult {
  filters: AnalyticsFilters;
  setFilters: React.Dispatch<React.SetStateAction<AnalyticsFilters>>;
  summary: QSealAnalyticsSummary | null;
  trends: QSealScanTrendItem[];
  products: QSealProductAnalyticsItem[];
  geography: QSealGeographyAnalyticsItem[];
  devices: QSealDeviceAnalyticsItem[];
  history: QSealAnalyticsHistoryItem[];
  reviewSuspicious: (eventId: string, reviewStatus: QSealSuspiciousReviewStatus) => Promise<void>;
  reviewingEventId: string | null;
  productOptions: QSealProductListItem[];
  blockOptions: QSealBlockOption[];
  historyPagination: QSealAnalyticsHistoryResponse['pagination'] | null;
  historyLoading: boolean;
  historyPage: number;
  setHistoryPage: (page: number) => void;
  exportHistory: () => Promise<QSealAnalyticsHistoryItem[]>;
  loading: boolean;
  error: string | null;
  analyticsEnabled: boolean | null;
  featureFlagLoading: boolean;
  refetch: () => void;
}

export function useAnalyticsManagement(): UseAnalyticsManagementResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [filters, setFilters] = React.useState<AnalyticsFilters>(defaultDateRange());
  const [summary, setSummary] = React.useState<QSealAnalyticsSummary | null>(null);
  const [trends, setTrends] = React.useState<QSealScanTrendItem[]>([]);
  const [products, setProducts] = React.useState<QSealProductAnalyticsItem[]>([]);
  const [geography, setGeography] = React.useState<QSealGeographyAnalyticsItem[]>([]);
  const [devices, setDevices] = React.useState<QSealDeviceAnalyticsItem[]>([]);
  const [history, setHistory] = React.useState<QSealAnalyticsHistoryItem[]>([]);
  const [productOptions, setProductOptions] = React.useState<QSealProductListItem[]>([]);
  const [blockOptions, setBlockOptions] = React.useState<QSealBlockOption[]>([]);
  const [historyPagination, setHistoryPagination] = React.useState<QSealAnalyticsHistoryResponse['pagination'] | null>(null);
  const [historyPage, setHistoryPage] = React.useState(1);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [reviewingEventId, setReviewingEventId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [analyticsEnabled, setAnalyticsEnabled] = React.useState<boolean | null>(null);
  const [featureFlagLoading, setFeatureFlagLoading] = React.useState(true);

  const fetchFeatureFlag = React.useCallback(async () => {
    if (!accessToken) {
      setAnalyticsEnabled(false);
      setFeatureFlagLoading(false);
      return;
    }
    setFeatureFlagLoading(true);
    try {
      const flag = await featureFlagApi.evaluate(accessToken, 'analytics_module_enabled');
      setAnalyticsEnabled(flag.enabled && flag.visible);
    } catch (err) {
      setAnalyticsEnabled(false);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setFeatureFlagLoading(false);
    }
  }, [accessToken]);

  const fetchProducts = React.useCallback(async () => {
    if (!accessToken) return;
    try {
      const [productResponse, blockResponse] = await Promise.all([
        qrProductApi.list(accessToken, 1, 100),
        analyticsApi.getQSealBlocks(accessToken),
      ]);
      setProductOptions(productResponse.products || []);
      setBlockOptions(blockResponse);
    } catch {
      // Product options are optional; the analytics page remains usable without them.
    }
  }, [accessToken]);

  const fetchAll = React.useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    if (analyticsEnabled !== true) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [summaryData, trendData, productData, geographyData, deviceData] = await Promise.all([
        analyticsApi.getQSealSummary(accessToken, filters),
        analyticsApi.getQSealTrends(accessToken, filters),
        analyticsApi.getQSealProducts(accessToken, { ...filters, limit: 100 }),
        analyticsApi.getQSealGeography(accessToken, { ...filters, limit: 500 }),
        analyticsApi.getQSealDevices(accessToken, { ...filters, limit: 100 }),
      ]);

      setSummary(summaryData);
      setTrends(trendData);
      setProducts(productData);
      setGeography(geographyData);
      setDevices(deviceData);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [accessToken, analyticsEnabled, filters]);

  const fetchHistory = React.useCallback(async () => {
    if (!accessToken || analyticsEnabled !== true) return;
    setHistoryLoading(true);
    try {
      const response = await analyticsApi.getQSealHistory(accessToken, historyPage, 25, filters);
      setHistory(response.events || []);
      setHistoryPagination(response.pagination);
    } catch (err) {
      console.error('Failed to fetch QSeal scan history:', err);
      setHistory([]);
      setHistoryPagination(null);
    } finally {
      setHistoryLoading(false);
    }
  }, [accessToken, analyticsEnabled, filters, historyPage]);

  const reviewSuspicious = React.useCallback(async (eventId: string, reviewStatus: QSealSuspiciousReviewStatus) => {
    if (!accessToken) return;
    setReviewingEventId(eventId);
    setError(null);
    try {
      await analyticsApi.reviewQSealSuspicious(accessToken, eventId, reviewStatus);
      setHistory((current) => current.map((event) => (
        event.id === eventId ? { ...event, review_status: reviewStatus } : event
      )));
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setReviewingEventId(null);
    }
  }, [accessToken]);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  React.useEffect(() => {
    fetchFeatureFlag();
  }, [fetchFeatureFlag]);

  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  React.useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  React.useEffect(() => {
    setHistoryPage(1);
  }, [filters]);

  const exportHistory = React.useCallback(async () => {
    if (!accessToken || analyticsEnabled !== true) return [];
    const allEvents: QSealAnalyticsHistoryItem[] = [];
    let page = 1;
    let hasNext = true;
    while (hasNext) {
      const response = await analyticsApi.getQSealHistory(accessToken, page, 200, filters);
      allEvents.push(...response.events);
      hasNext = response.pagination.has_next;
      page += 1;
    }
    return allEvents;
  }, [accessToken, analyticsEnabled, filters]);

  const refetch = React.useCallback(() => {
    fetchAll();
    fetchHistory();
    fetchProducts();
  }, [fetchAll, fetchHistory, fetchProducts]);

  return {
    filters,
    setFilters,
    summary,
    trends,
    products,
    geography,
    devices,
    history,
    reviewSuspicious,
    reviewingEventId,
    productOptions,
    blockOptions,
    historyPagination,
    historyLoading,
    historyPage,
    setHistoryPage,
    exportHistory,
    loading,
    error,
    analyticsEnabled,
    featureFlagLoading,
    refetch,
  };
}
