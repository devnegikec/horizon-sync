export const environment = {
  production: true,
  apiCoreUrl: process.env.NX_API_CORE_URL || 'http://192.168.0.108:8001',
  apiBaseUrl: process.env.NX_API_BASE_URL || 'http://192.168.0.108:8000',
  apiIdentityUrl: process.env.NX_API_IDENTITY_URL || process.env.NX_API_BASE_URL || 'http://192.168.0.108:8000',
};
