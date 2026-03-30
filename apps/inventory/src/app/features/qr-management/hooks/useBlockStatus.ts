import { useState, useEffect, useRef } from 'react';

import { qrBlockService } from '../services/qrBlockService';
import type { QRBlock, BlockStatus } from '../types/qrBlock.types';

const TERMINAL: BlockStatus[] = ['completed', 'failed'];
const POLL_MS = 3000;

export const useBlockStatus = (blockId: string | null) => {
  const [block, setBlock] = useState<QRBlock | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  const poll = async () => {
    if (!blockId) return;
    try {
      const data = await qrBlockService.getBlock(blockId);
      setBlock(data);
      if (TERMINAL.includes(data.status)) stop();
    } catch { stop(); }
  };

  useEffect(() => {
    if (!blockId) return;
    setLoading(true);
    poll().finally(() => setLoading(false));
    intervalRef.current = setInterval(poll, POLL_MS);
    return stop;
  }, [blockId]);

  return { block, loading };
};
