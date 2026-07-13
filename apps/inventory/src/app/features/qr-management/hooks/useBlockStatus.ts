import { useState, useEffect, useRef } from 'react';

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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const poll = async () => {
    if (!blockId) return;
    try {
      const data = await qrBlockService.getBlock(blockId);
      setBlock(data);
      
      if (TERMINAL.includes(data.status)) {
        stop();
      } else {
        // Exponential backoff: 1s → 1.5s → 2.25s → 3.375s → ... → max 10s
        const nextInterval = Math.min(pollInterval * BACKOFF_MULTIPLIER, MAX_POLL_MS);
        setPollInterval(nextInterval);
        timeoutRef.current = setTimeout(poll, nextInterval);
      }
    } catch {
      // Retry with backoff on error
      const nextInterval = Math.min(pollInterval * BACKOFF_MULTIPLIER, MAX_POLL_MS);
      setPollInterval(nextInterval);
      timeoutRef.current = setTimeout(poll, nextInterval);
    }
  };

  useEffect(() => {
    if (!blockId) return;
    setPollInterval(INITIAL_POLL_MS); // Reset interval on new block
    setLoading(true);
    poll().finally(() => setLoading(false));
    return stop;
  }, [blockId]);

  return { block, loading, pollInterval };
};
