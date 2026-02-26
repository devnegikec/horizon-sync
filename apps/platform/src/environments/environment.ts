// This file can be replaced during build by using the `fileReplacements` array.
// When building for production, this file is replaced with `environment.prod.ts`.

export const environment = {
  production: false,
  apiBaseUrl: process.env['NX_API_BASE_URL'] || 'http://localhost:8000/api/v1',
  searchApiBaseUrl: process.env['NX_SEARCH_API_BASE_URL'] || 'http://localhost:8002/api/v1',
};
