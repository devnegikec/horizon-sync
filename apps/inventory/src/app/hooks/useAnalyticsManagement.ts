import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import { analyticsApi } from '../api/analytics';
import { qrProductApi } from '../api/qr-products';
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
import { featureFlagApi } from '../utility/api/feature-flags';

function defaultDateRange(productId?: string): Pick<AnalyticsFilters, 'date_from' | 'date_to' | 'product_id'> {
  const to = new Date();
  const from = new Date(Date.now() - 30 * 86400000);
  return { date_from: from.toISOString(), date_to: to.toISOString(), product_id: productId };
}

function previousPeriodFilters(filters: AnalyticsFilters): AnalyticsFilters | null {
  if (!filters.date_from || !filters.date_to) return null;
  const currentFrom = Date.parse(filters.date_from);
  const currentTo = Date.parse(filters.date_to);
  if (!Number.isFinite(currentFrom) || !Number.isFinite(currentTo) || currentTo < currentFrom) return null;

  const duration = currentTo - currentFrom;
  const previousTo = currentFrom - 1;
  const previousFrom = previousTo - duration;
  return {
    ...filters,
    date_from: new Date(previousFrom).toISOString(),
    date_to: new Date(previousTo).toISOString(),
  };
}

function hasInvalidDateRange(filters: AnalyticsFilters): boolean {
  if (!filters.date_from || !filters.date_to) return false;
  const from = Date.parse(filters.date_from);
  const to = Date.parse(filters.date_to);
  return !Number.isFinite(from) || !Number.isFinite(to) || from > to;
}

export type AnalyticsSection = 'summary' | 'trends' | 'products' | 'geography' | 'devices';
export type AnalyticsSectionErrors = Partial<Record<AnalyticsSection, string>>;

export interface UseAnalyticsManagementResult {
  filters: AnalyticsFilters;
  setFilters: React.Dispatch<React.SetStateAction<AnalyticsFilters>>;
  summary: QSealAnalyticsSummary | null;
  previousSummary: QSealAnalyticsSummary | null;
  previousPeriod: Pick<AnalyticsFilters, 'date_from' | 'date_to'> | null;
  sectionErrors: AnalyticsSectionErrors;
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
  historyError: string | null;
  historyPage: number;
  setHistoryPage: (page: number) => void;
  historyPageSize: number;
  setHistoryPageSize: (pageSize: number) => void;
  exportHistory: () => Promise<QSealAnalyticsHistoryItem[]>;
  loading: boolean;
  error: string | null;
  analyticsEnabled: boolean | null;
  featureFlagLoading: boolean;
  refetch: () => void;
}

export function useAnalyticsManagement(initialProductId?: string): UseAnalyticsManagementResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [filters, setFilters] = React.useState<AnalyticsFilters>(() => defaultDateRange(initialProductId));
  const [summary, setSummary] = React.useState<QSealAnalyticsSummary | null>(null);
  const [previousSummary, setPreviousSummary] = React.useState<QSealAnalyticsSummary | null>(null);
  const [sectionErrors, setSectionErrors] = React.useState<AnalyticsSectionErrors>({});
  const [trends, setTrends] = React.useState<QSealScanTrendItem[]>([]);
  const [products, setProducts] = React.useState<QSealProductAnalyticsItem[]>([]);
  const [geography, setGeography] = React.useState<QSealGeographyAnalyticsItem[]>([]);
  const [devices, setDevices] = React.useState<QSealDeviceAnalyticsItem[]>([]);
  const [history, setHistory] = React.useState<QSealAnalyticsHistoryItem[]>([]);
  const [productOptions, setProductOptions] = React.useState<QSealProductListItem[]>([]);
  const [blockOptions, setBlockOptions] = React.useState<QSealBlockOption[]>([]);
  const [historyPagination, setHistoryPagination] = React.useState<QSealAnalyticsHistoryResponse['pagination'] | null>(null);
  const [historyPage, setHistoryPage] = React.useState(1);
  const [historyPageSize, setHistoryPageSize] = React.useState(20);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [historyError, setHistoryError] = React.useState<string | null>(null);
  const [reviewingEventId, setReviewingEventId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [analyticsEnabled, setAnalyticsEnabled] = React.useState<boolean | null>(null);
  const [featureFlagLoading, setFeatureFlagLoading] = React.useState(true);
  React.useEffect(() => {
    if (!initialProductId) return;
    setFilters((current) => (current.product_id === initialProductId ? current : { ...current, product_id: initialProductId }));
  }, [initialProductId]);
  const previousPeriod = React.useMemo(() => {
    const range = previousPeriodFilters(filters);
    return range ? { date_from: range.date_from, date_to: range.date_to } : null;
  }, [filters]);

  // Request generations guard against stale responses overwriting newer state.
  const featureFlagRequestId = React.useRef(0);
  const dashboardRequestId = React.useRef(0);
  const historyRequestId = React.useRef(0);

  const fetchFeatureFlag = React.useCallback(async () => {
    const requestId = ++featureFlagRequestId.current;
    if (!accessToken) {
      setAnalyticsEnabled(false);
      setFeatureFlagLoading(false);
      return;
    }
    setFeatureFlagLoading(true);
    try {
      const flag = await featureFlagApi.evaluate(accessToken, 'analytics_module_enabled');
      if (requestId !== featureFlagRequestId.current) return;
      setAnalyticsEnabled(flag.enabled && flag.visible);
    } catch (err) {
      if (requestId !== featureFlagRequestId.current) return;
      setAnalyticsEnabled(false);
      setError(getFriendlyErrorMessage(err));
    } finally {
      if (requestId === featureFlagRequestId.current) {
        setFeatureFlagLoading(false);
      }
    }
  }, [accessToken]);

  const fetchProducts = React.useCallback(async () => {
    if (!accessToken) return;
    try {
      const [productResponse, blockResponse] = await Promise.all([qrProductApi.list(accessToken, 1, 100), analyticsApi.getQSealBlocks(accessToken)]);
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

    const requestId = ++dashboardRequestId.current;
    setLoading(true);
    setError(null);
    setPreviousSummary(null);
    setSectionErrors({});
    if (hasInvalidDateRange(filters)) {
      setError('Choose a valid date range before loading analytics.');
      setLoading(false);
      return;
    }
    const comparisonFilters = previousPeriodFilters(filters);
    try {
      const previousSummaryPromise = comparisonFilters
        ? analyticsApi.getQSealSummary(accessToken, comparisonFilters).catch(() => null)
        : Promise.resolve(null);
      const [summaryResult, previousSummaryResult, trendResult, productResult, geographyResult, deviceResult] = await Promise.allSettled([
        analyticsApi.getQSealSummary(accessToken, filters),
        previousSummaryPromise,
        analyticsApi.getQSealTrends(accessToken, filters),
        analyticsApi.getQSealProducts(accessToken, { ...filters, limit: 100 }),
        analyticsApi.getQSealGeography(accessToken, { ...filters, limit: 500 }),
        analyticsApi.getQSealDevices(accessToken, { ...filters, limit: 100 }),
      ]);

      if (requestId !== dashboardRequestId.current) return;
      const nextErrors: AnalyticsSectionErrors = {};
      const getError = (result: PromiseSettledResult<unknown>) => (result.status === 'rejected' ? getFriendlyErrorMessage(result.reason) : null);
      const summaryError = getError(summaryResult);
      const trendsError = getError(trendResult);
      const productsError = getError(productResult);
      const geographyError = getError(geographyResult);
      const devicesError = getError(deviceResult);
      if (summaryError) nextErrors.summary = summaryError;
      if (trendsError) nextErrors.trends = trendsError;
      if (productsError) nextErrors.products = productsError;
      if (geographyError) nextErrors.geography = geographyError;
      if (devicesError) nextErrors.devices = devicesError;
      setSectionErrors(nextErrors);
      // Drop the previous summary on failure so stale metrics from the old filters
      // are never shown next to the error message.
      setSummary(summaryResult.status === 'fulfilled' ? summaryResult.value : null);
      if (previousSummaryResult.status === 'fulfilled') setPreviousSummary(previousSummaryResult.value);
      if (trendResult.status === 'fulfilled') setTrends(trendResult.value);
      if (productResult.status === 'fulfilled') setProducts(productResult.value);
      if (geographyResult.status === 'fulfilled') setGeography(geographyResult.value);
      if (deviceResult.status === 'fulfilled') setDevices(deviceResult.value);
      setError(summaryError);
    } catch (err) {
      if (requestId !== dashboardRequestId.current) return;
      setError(getFriendlyErrorMessage(err));
    } finally {
      if (requestId === dashboardRequestId.current) {
        setLoading(false);
      }
    }
  }, [accessToken, analyticsEnabled, filters]);

  const fetchHistory = React.useCallback(async () => {
    if (!accessToken || analyticsEnabled !== true) return;
    const requestId = ++historyRequestId.current;
    if (hasInvalidDateRange(filters)) {
      setHistoryError('Choose a valid date range before loading scan events.');
      setHistoryLoading(false);
      return;
    }
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const response = await analyticsApi.getQSealHistory(accessToken, historyPage, historyPageSize, filters);
      if (requestId !== historyRequestId.current) return;
      setHistory(response.events || []);
      setHistoryPagination(response.pagination);
    } catch (err) {
      if (requestId !== historyRequestId.current) return;
      console.error('Failed to fetch QSeal scan history:', err);
      setHistory([]);
      setHistoryPagination(null);
      setHistoryError(getFriendlyErrorMessage(err));
    } finally {
      if (requestId === historyRequestId.current) {
        setHistoryLoading(false);
      }
    }
  }, [accessToken, analyticsEnabled, filters, historyPage, historyPageSize]);

  const reviewSuspicious = React.useCallback(
    async (eventId: string, reviewStatus: QSealSuspiciousReviewStatus) => {
      if (!accessToken) return;
      setReviewingEventId(eventId);
      setError(null);
      try {
        await analyticsApi.reviewQSealSuspicious(accessToken, eventId, reviewStatus);
        setHistory((current) => current.map((event) => (event.id === eventId ? { ...event, review_status: reviewStatus } : event)));
      } catch (err) {
        setError(getFriendlyErrorMessage(err));
      } finally {
        setReviewingEventId(null);
      }
    },
    [accessToken],
  );

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
    previousSummary,
    previousPeriod,
    sectionErrors,
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
    historyError,
    historyPage,
    setHistoryPage,
    historyPageSize,
    setHistoryPageSize,
    exportHistory,
    loading,
    error,
    analyticsEnabled,
    featureFlagLoading,
    refetch,
  };
}
