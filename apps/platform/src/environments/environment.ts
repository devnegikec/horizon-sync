// This file can be replaced during build by using the `fileReplacements` array.
// When building for production, this file is replaced with `environment.prod.ts`.

export const environment = {
  production: false,
  apiBaseUrl: process.env.NX_API_BASE_URL || 'https://f3ff-2409-40c2-11ae-5835-b963-ef28-78f4-c277.ngrok-free.app',
  apiCoreUrl: process.env.NX_API_CORE_URL || 'https://f3ff-2409-40c2-11ae-5835-b963-ef28-78f4-c277.ngrok-free.app',
  searchApiBaseUrl: process.env.NX_SEARCH_API_BASE_URL || 'https://f3ff-2409-40c2-11ae-5835-b963-ef28-78f4-c277.ngrok-free.app',
};
