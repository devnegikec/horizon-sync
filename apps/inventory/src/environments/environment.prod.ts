export const environment = {
  production: true,
  apiCoreUrl: (typeof process !== 'undefined' && process.env?.['NX_API_CORE_URL']) || 'http://192.168.0.108:8001/api/v1',
};
