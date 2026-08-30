import { useCallback, useEffect, useRef, useState } from 'react';

import { qrBlockService } from '../services/qrBlockService';
import type { QRBlock, BlockStatus } from '../types/qrBlock.types';

const TERMINAL: BlockStatus[] = ['completed', 'failed'];
const INITIAL_POLL_MS = 1000;
const MAX_POLL_MS = 10000;
const BACKOFF_MULTIPLIER = 1.5;

export const useBlockStatus = (blockId: string | null) => {
  const [block, setBlock] = useState<QRBlock | null>(null);
  const [loading, setLoading] = useState(false);
  const [pollInterval, setPollInterval] = useState(INITIAL_POLL_MS);
  const latestRequestRef = useRef(0);

  useEffect(() => {
    if (!blockId) return;

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let interval = INITIAL_POLL_MS;
    // Invalidate any in-flight request from a previous blockId.
    latestRequestRef.current += 1;

    const poll = async () => {
      if (cancelled) return;
      const requestId = ++latestRequestRef.current;
      try {
        const data = await qrBlockService.getBlock(blockId);
        if (cancelled || requestId !== latestRequestRef.current) return;
        setBlock(data);
        if (TERMINAL.includes(data.status)) return;
      } catch {
        if (cancelled || requestId !== latestRequestRef.current) return;
      }

      interval = Math.min(
        interval * BACKOFF_MULTIPLIER,
        MAX_POLL_MS,
      );
      setPollInterval(interval);
      timeout = setTimeout(poll, interval);
    };

    setBlock(null);
    setPollInterval(INITIAL_POLL_MS);
    setLoading(true);
    poll().finally(() => setLoading(false));

    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [blockId]);

  const refetch = useCallback(async () => {
    if (!blockId) return;
    const requestId = ++latestRequestRef.current;
    setLoading(true);
    try {
      const data = await qrBlockService.getBlock(blockId);
      if (requestId !== latestRequestRef.current) return;
      setBlock(data);
    } catch {
      // Keep the existing block on failure.
    } finally {
      if (requestId === latestRequestRef.current) setLoading(false);
    }
  }, [blockId]);

  return { block, loading, pollInterval, refetch };
};
