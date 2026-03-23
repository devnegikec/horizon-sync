import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import { qrProductSettingApi } from '../api/qr-product-settings';
import type {
  QRProductSetting,
  QRProductSettingCreate,
  QRProductSettingUpdate,
  QRProductSettingListResponse,
  SettingType,
} from '../types/qr-product-settings.types';

export function useQRProductSettings(settingType?: SettingType) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [data, setData] = React.useState<QRProductSettingListResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const fetchSettings = React.useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await qrProductSettingApi.list(accessToken, {
        setting_type: settingType,
        page: 1,
        page_size: 100,
      });
      setData(result);
    } catch (err: unknown) {
      const apiErr = err as { details?: { detail?: string }; message?: string };
      setError(apiErr.details?.detail || apiErr.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  }, [accessToken, settingType]);

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const createSetting = React.useCallback(
    async (payload: QRProductSettingCreate): Promise<QRProductSetting | null> => {
      if (!accessToken) return null;
      setSaving(true);
      setError(null);
      try {
        const result = await qrProductSettingApi.create(accessToken, payload);
        await fetchSettings();
        return result;
      } catch (err: unknown) {
        const apiErr = err as { details?: { detail?: string }; message?: string };
        const msg = apiErr.details?.detail || apiErr.message || 'Failed to create setting';
        setError(msg);
        throw new Error(msg);
      } finally {
        setSaving(false);
      }
    },
    [accessToken, fetchSettings],
  );

  const updateSetting = React.useCallback(
    async (id: string, payload: QRProductSettingUpdate): Promise<QRProductSetting | null> => {
      if (!accessToken) return null;
      setSaving(true);
      setError(null);
      try {
        const result = await qrProductSettingApi.update(accessToken, id, payload);
        await fetchSettings();
        return result;
      } catch (err: unknown) {
        const apiErr = err as { details?: { detail?: string }; message?: string };
        const msg = apiErr.details?.detail || apiErr.message || 'Failed to update setting';
        setError(msg);
        throw new Error(msg);
      } finally {
        setSaving(false);
      }
    },
    [accessToken, fetchSettings],
  );

  const deleteSetting = React.useCallback(
    async (id: string): Promise<void> => {
      if (!accessToken) return;
      setSaving(true);
      setError(null);
      try {
        await qrProductSettingApi.delete(accessToken, id);
        await fetchSettings();
      } catch (err: unknown) {
        const apiErr = err as { details?: { detail?: string }; message?: string };
        const msg = apiErr.details?.detail || apiErr.message || 'Failed to delete setting';
        setError(msg);
        throw new Error(msg);
      } finally {
        setSaving(false);
      }
    },
    [accessToken, fetchSettings],
  );

  return {
    settings: data?.settings ?? [],
    pagination: data?.pagination ?? null,
    loading,
    error,
    saving,
    refetch: fetchSettings,
    createSetting,
    updateSetting,
    deleteSetting,
  };
}
