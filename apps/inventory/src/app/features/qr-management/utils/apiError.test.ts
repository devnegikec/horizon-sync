import { getApiErrorMessage } from './apiError';

describe('getApiErrorMessage', () => {
  it('extracts a message from a structured feature error', () => {
    const error = {
      response: {
        data: {
          detail: {
            code: 'FEATURE_DISABLED',
            feature: 'qseal_module_enabled',
            message: 'QSeal is not enabled for this organization',
          },
        },
      },
    };

    expect(getApiErrorMessage(error, 'Failed to fetch credits')).toBe(
      'QSeal is not enabled for this organization',
    );
  });

  it('returns the fallback instead of exposing an unrenderable object', () => {
    const error = { response: { data: { detail: { code: 'UNKNOWN' } } } };

    expect(getApiErrorMessage(error, 'Failed to fetch credits')).toBe(
      'Failed to fetch credits',
    );
  });
});
