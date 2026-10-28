import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import { qsealActivationApi } from '../api/qseal-activation';
import type {
  QSealActivationHistoryResponse,
  QSealActivationSettings,
  QSealActivationSettingsInput,
  QSealActivationSettingsSaveResponse,
  QSealActivationSummary,
  QSealDestinationMarket,
} from '../types/qseal-activation.types';
import type { ApiError } from '../utility/api/core';

export function getActivationErrorCode(error: unknown): string | undefined {
  const details = (error as ApiError).details as { detail?: { code?: string } } | undefined;
  return details?.detail?.code;
}

export function useQSealActivation(productId: string | null) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [summary, setSummary] = React.useState<QSealActivationSummary | null>(null);
  const [settings, setSettings] = React.useState<QSealActivationSettings | null>(null);
  const [history, setHistory] = React.useState<QSealActivationHistoryResponse | null>(null);
  const [markets, setMarkets] = React.useState<QSealDestinationMarket[]>([]);
  const [marketsLoading, setMarketsLoading] = React.useState(false);
  const [marketsError, setMarketsError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!accessToken || !productId) {
      setSummary(null);
      setSettings(null);
      setHistory(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [summaryResult, historyResult] = await Promise.all([
        qsealActivationApi.getSummary(accessToken, productId),
        qsealActivationApi.getHistory(accessToken, productId),
      ]);
      setSummary(summaryResult);
      setSettings(summaryResult.current_settings);
      setHistory(historyResult);
    } catch (err) {
      setSummary(null);
      setSettings(null);
      setHistory(null);
      setError((err as ApiError).message || 'Failed to load activation data.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, productId]);

  React.useEffect(() => {
    void fetchData();
  }, [fetchData]);
  const fetchMarkets = React.useCallback(async () => {
    if (!accessToken) {
      setMarkets([]);
      return;
    }
    setMarketsLoading(true);
    setMarketsError(null);
    try {
      const response = await qsealActivationApi.listDestinationMarkets(accessToken);
      setMarkets(response.markets.filter((market) => market.is_active));
    } catch (err) {
      setMarkets([]);
      setMarketsError((err as ApiError).message || 'Failed to load destination markets.');
    } finally {
      setMarketsLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    void fetchMarkets();
  }, [fetchMarkets]);

  const saveSettings = React.useCallback(
    async (data: QSealActivationSettingsInput): Promise<QSealActivationSettingsSaveResponse> => {
      if (!accessToken || !productId) throw new Error('Select a product first.');
      setSaving(true);
      setError(null);
      try {
        const result = await qsealActivationApi.saveSettings(accessToken, productId, data);
        await fetchData();
        return result;
      } catch (err) {
        setError((err as ApiError).message || 'Failed to save activation settings.');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [accessToken, productId, fetchData],
  );

  return {
    summary,
    settings,
    history,
    markets,
    marketsLoading,
    marketsError,
    loading,
    saving,
    error,
    refetch: fetchData,
    refetchMarkets: fetchMarkets,
    saveSettings,
  };
}
