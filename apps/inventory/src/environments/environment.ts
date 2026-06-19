export const environment = {
  production: false,
  apiCoreUrl: process.env.NX_API_CORE_URL || 'http://localhost:8001',
  apiBaseUrl: process.env.NX_API_BASE_URL || 'http://localhost:8000',
  apiIdentityUrl: process.env.NX_API_IDENTITY_URL || 'http://localhost:8000',
};
