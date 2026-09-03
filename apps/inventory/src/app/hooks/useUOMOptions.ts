import { useState, useEffect } from 'react';

import { apiRequest, getFriendlyErrorMessage } from '../utility/api/core';

export interface UOM {
  id: string;
  name: string;
  abbreviation: string;
  uom_type?: string | null;
}

interface UOMListResponse {
  uoms: UOM[];
  pagination: {
    total_items: number;
  };
}

export interface UOMOption {
  label: string;       // "Kilogram (kg)"
  value: string;       // "kg" — abbreviation used in payloads
}

export function useUOMOptions(accessToken: string, uomTypes?: string[]) {
  const [options, setOptions] = useState<UOMOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uomTypeParam = uomTypes && uomTypes.length > 0 ? uomTypes.join(',') : undefined;

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    setLoading(true);
    setError(null);

    apiRequest<UOMListResponse>('/uoms', accessToken, {
      params: {
        page: 1,
        page_size: 100,
        sort_by: 'created_at',
        sort_order: 'desc',
        ...(uomTypeParam ? { uom_type: uomTypeParam } : {}),
      },
    })
      .then((data) => {
        if (cancelled) return;
        setOptions(
          (data.uoms || []).map((u) => ({
            label: `${u.name} (${u.abbreviation})`,
            value: u.abbreviation,
          }))
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getFriendlyErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, uomTypeParam]);

  return { options, loading, error };
}
