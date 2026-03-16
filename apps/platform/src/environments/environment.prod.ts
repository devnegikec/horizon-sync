export const environment = {
  production: true,
  apiBaseUrl: process.env.NX_API_BASE_URL || 'http://localhost:8001',
  apiCoreUrl: process.env.NX_API_CORE_URL || 'http://localhost:8001',
  searchApiBaseUrl: process.env.NX_SEARCH_API_BASE_URL || 'http://localhost:8002',
};
