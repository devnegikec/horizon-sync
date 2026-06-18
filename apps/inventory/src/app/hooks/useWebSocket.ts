import * as React from 'react';

export interface UseWebSocketOptions {
  /** Called for each incoming message. */
  onMessage?: (event: MessageEvent) => void;
  /** Milliseconds between reconnect attempts (default: 3000). */
  reconnectDelay?: number;
  /** Set false to disable the connection (e.g. warehouseId not yet known). */
  enabled?: boolean;
}

export interface UseWebSocketResult {
  /** Whether the WebSocket is currently OPEN. */
  connected: boolean;
  /** Send a JSON-serialisable message (no-op if not connected). */
  send: (data: unknown) => void;
}

/**
 * Reconnecting WebSocket hook.
 *
 * Opens a WebSocket to `url`, automatically re-connecting with
 * `reconnectDelay` on close/error. Pass `enabled=false` to suspend
 * the connection (e.g. while waiting for an auth token).
 *
 * Phase 3 note: wire `url` to ws(s)://<host>/api/v1/wms-3d/ws?warehouse_id=X
 * once the backend WebSocket endpoint is implemented.
 */
export function useWebSocket(
  url: string | null,
  options: UseWebSocketOptions = {},
): UseWebSocketResult {
  const { onMessage, reconnectDelay = 3000, enabled = true } = options;

  const [connected, setConnected] = React.useState(false);
  const wsRef = React.useRef<WebSocket | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMessageRef = React.useRef(onMessage);

  // Keep callback ref up-to-date without re-triggering the connect effect
  React.useLayoutEffect(() => {
    onMessageRef.current = onMessage;
  });

  const connect = React.useCallback(() => {
    if (!url || !enabled) return;
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (ev) => onMessageRef.current?.(ev);

      ws.onclose = () => {
        setConnected(false);
        timerRef.current = setTimeout(connect, reconnectDelay);
      };

      ws.onerror = () => ws.close(); // triggers onclose → retry
    } catch {
      timerRef.current = setTimeout(connect, reconnectDelay);
    }
  }, [url, enabled, reconnectDelay]);

  React.useEffect(() => {
    connect();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  const send = React.useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { connected, send };
}
