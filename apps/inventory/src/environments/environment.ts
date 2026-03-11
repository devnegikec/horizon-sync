export const environment = {
  production: false,
  apiCoreUrl: process.env.NX_API_CORE_URL || 'http://localhost:8001/api/v1',
  apiBaseUrl: process.env.NX_API_BASE_URL || 'http://localhost:8000/api/v1',
};
