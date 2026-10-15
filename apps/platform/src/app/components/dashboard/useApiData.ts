import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import type { AsyncState } from './useWmsStats';

/**
 * Generic self-fetching hook for dashboard widgets.
 *
 * `key` must change whenever the loader's inputs change (e.g. a serialized
 * filter string) so the effect re-runs; `refreshToken` comes from the section.
 * The loader is read through a ref so callers don't need to memoize it.
 */
export function useApiData<T>(key: string, loader: (token: string) => Promise<T>, refreshToken: number): AsyncState<T> {
  const accessToken = useUserStore((s) => s.accessToken);
  const loaderRef = React.useRef(loader);
  const [state, setState] = React.useState<AsyncState<T>>({ data: null, loading: true, error: null });

  React.useEffect(() => {
    loaderRef.current = loader;
  });

  React.useEffect(() => {
    if (!accessToken) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    loaderRef.current(accessToken)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({ data: null, loading: false, error: err instanceof Error ? err.message : 'Failed to load data' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, key, refreshToken]);

  return state;
}
