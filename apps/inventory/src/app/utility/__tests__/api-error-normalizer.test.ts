import { describe, expect, it, jest } from '@jest/globals';

import { toNormalizedApiError } from '../api/core';

/** Mirrors what `req`/`apiRequest` throw: an `Error` carrying status + body. */
function apiError(status: number, details?: unknown): Error {
  return Object.assign(new Error('server said no'), { status, details });
}

describe('toNormalizedApiError', () => {
  it('reads the domain envelope, keeping the hint and field details', () => {
    const result = toNormalizedApiError(
      apiError(400, {
        error: 'SHORT_QTY_EXCEEDS_EXPECTED',
        message: 'Shortage of 7 unit(s) exceeds the outstanding quantity for this ASN line',
        hint: 'Enter a value between 1 and 4.',
        details: [{ field: 'short_qty', reason: 'short_qty (7) is greater than the outstanding quantity (4)', hint: 'Enter at most 4 unit(s).' }],
      }),
    );

    expect(result.code).toBe('SHORT_QTY_EXCEEDS_EXPECTED');
    expect(result.httpStatus).toBe(400);
    expect(result.message).toContain('exceeds the outstanding quantity');
    expect(result.hint).toBe('Enter a value between 1 and 4.');
    expect(result.fields).toEqual([
      { field: 'short_qty', reason: 'short_qty (7) is greater than the outstanding quantity (4)', hint: 'Enter at most 4 unit(s).' },
    ]);
  });

  it('reads a 409 state clash so the UI can explain what to do next', () => {
    const result = toNormalizedApiError(
      apiError(409, {
        error: 'SLIP_NOT_PENDING_REVIEW',
        message: 'Receipt lines can only be flagged while the slip is pending review',
        current_state: 'pending_putaway',
        required_state: ['pending_review'],
        hint: 'Flags must be applied before the note is approved.',
      }),
    );

    expect(result.code).toBe('SLIP_NOT_PENDING_REVIEW');
    expect(result.currentState).toBe('pending_putaway');
    expect(result.requiredState).toEqual(['pending_review']);
  });

  it('maps the FastAPI validation envelope onto field errors', () => {
    const result = toNormalizedApiError(
      apiError(400, {
        detail: {
          message: 'Invalid input data',
          status_code: 400,
          code: 'VALIDATION_ERROR',
          errors: [{ field: 'short_qty', message: 'Input should be a valid integer' }],
        },
      }),
    );

    expect(result.code).toBe('VALIDATION_ERROR');
    expect(result.message).toBe('Invalid input data');
    expect(result.fields).toEqual([{ field: 'short_qty', message: 'Input should be a valid integer' }]);
  });

  it('turns a 401 into a login redirect signal, not a form error', () => {
    const listener = jest.fn();
    window.addEventListener('app:session-expired', listener);

    const result = toNormalizedApiError(apiError(401, { detail: 'Invalid authentication credentials' }));

    window.removeEventListener('app:session-expired', listener);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(result.code).toBe('UNAUTHORIZED');
    expect(result.httpStatus).toBe(401);
    expect(result.message).toContain('session has expired');
  });

  it('reports a request that never reached the API as a network failure', () => {
    const result = toNormalizedApiError(new Error('Failed to fetch'));

    expect(result.code).toBe('NETWORK');
    expect(result.httpStatus).toBe(0);
    expect(result.message).not.toBe('');
  });
});
