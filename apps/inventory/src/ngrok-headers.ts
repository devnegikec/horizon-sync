/**
 * Patches the global `fetch` and axios defaults to include the
 * `ngrok-skip-browser-warning` header on every outgoing request.
 *
 * Ngrok's free-tier proxy injects an interstitial HTML page for browser
 * requests that don't carry this header, which breaks JSON API calls and
 * manifests as CORS / parse errors on the client.
 *
 * Call once at app startup, before any API calls are made.
 */

import axios from 'axios';

const NGROK_HEADER = 'ngrok-skip-browser-warning';
const NGROK_VALUE = 'true';

export function installNgrokHeaders(): void {
  // --- Patch global fetch ---
  const originalFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers);

    if (!headers.has(NGROK_HEADER)) {
      headers.set(NGROK_HEADER, NGROK_VALUE);
    }

    return originalFetch(input, { ...init, headers });
  };

  // --- Patch axios defaults (inventory app uses axios) ---
  axios.defaults.headers.common[NGROK_HEADER] = NGROK_VALUE;
}
