export const environment = {
  production: true,
  apiCoreUrl: process.env.NX_API_CORE_URL || 'http://192.168.0.108:8001/api/v1',
  apiBaseUrl: process.env.NX_API_BASE_URL || 'http://192.168.0.108:8000/api/v1',
};
