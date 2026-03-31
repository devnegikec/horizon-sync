export const environment = {
  production: true,
  apiBaseUrl: process.env.NX_API_BASE_URL || 'http://localhost:8000',
  apiCoreUrl: process.env.NX_API_CORE_URL || 'http://localhost:8001',
  apiIdentityUrl: process.env.NX_API_IDENTITY_URL || 'http://localhost:8000',
};
