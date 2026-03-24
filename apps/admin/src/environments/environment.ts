export const environment = {
  production: false,
  apiBaseUrl: process.env.NX_API_BASE_URL || 'http://localhost:8000',
  apiCoreUrl: process.env.NX_API_CORE_URL || 'http://localhost:8001',
};
