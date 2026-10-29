const configuredCoreApiUrl = process.env.NX_API_CORE_URL;
const browserOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8001';
const isLoopbackCoreApi = Boolean(
  configuredCoreApiUrl && /^https?:\/\/(localhost|127(?:\.\d{1,3}){3})(?::\d+)?(?:\/|$)/i.test(configuredCoreApiUrl),
);

export const environment = {
  production: true,
  apiBaseUrl: process.env.NX_API_BASE_URL || 'http://localhost:8000',
  // Production QR pages are commonly served behind the same gateway as the
  // core API. Never default a public mobile scan to the phone's localhost.
  apiCoreUrl:
    configuredCoreApiUrl && !isLoopbackCoreApi ? configuredCoreApiUrl : browserOrigin,
  searchApiBaseUrl: process.env.NX_SEARCH_API_BASE_URL || 'http://localhost:8002',
};
