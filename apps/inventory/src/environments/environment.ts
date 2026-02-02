export const environment = {
  production: false,
  apiCoreUrl:
    (typeof process !== 'undefined' && process.env?.['NX_API_CORE_URL']) ||
    'http://localhost:8001/api/v1',
};
