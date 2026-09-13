import * as React from 'react';

/**
 * Calls `refetch` whenever `refreshKey` changes — skipping the initial mount.
 *
 * Lets a parent own a single Refresh button (bumping the key) while each list
 * keeps its own fetch logic.
 */
export function useRefreshOnKey(refreshKey: number | undefined, refetch: () => void): void {
  const lastRefreshKeyRef = React.useRef(refreshKey);
  React.useEffect(() => {
    if (lastRefreshKeyRef.current === refreshKey) return;
    lastRefreshKeyRef.current = refreshKey;
    refetch();
  }, [refreshKey, refetch]);
}
