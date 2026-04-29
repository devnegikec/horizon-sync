export const environment = {
  production: false,
  apiBaseUrl: process.env.NX_API_BASE_URL || 'http://localhost:9000',
  apiCoreUrl: process.env.NX_API_CORE_URL || 'http://localhost:9000',
  apiIdentityUrl: process.env.NX_API_IDENTITY_URL || 'http://localhost:9000',
};
