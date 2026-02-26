export const environment = {
  production: true,
  apiBaseUrl: process.env['NX_API_BASE_URL'] || 'http://localhost:8001/api/v1',
  searchApiBaseUrl: process.env['NX_SEARCH_API_BASE_URL'] || 'http://localhost:8002/api/v1',
};
