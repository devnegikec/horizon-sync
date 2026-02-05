export const environment = {
  production: false,
  apiCoreUrl: (typeof process !== 'undefined' && process.env?.['NX_API_CORE_URL']) || 'http://localhost:8001/api/v1',
  apiBaseUrl: (typeof process !== 'undefined' && process.env?.['NX_API_BASE_URL']) || 'http://localhost:8000/api/v1',
};
