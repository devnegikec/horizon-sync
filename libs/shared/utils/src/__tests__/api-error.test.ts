import { ApiError } from '../api-error';

describe('ApiError', () => {
  describe('constructor', () => {
    it('extracts detail from FastAPI standard format', () => {
      const error = new ApiError(422, 'Unprocessable Entity', '{"detail":"Insufficient credits"}');
      expect(error.message).toBe('Insufficient credits');
      expect(error.detail).toBe('Insufficient credits');
      expect(error.status).toBe(422);
      expect(error.statusText).toBe('Unprocessable Entity');
      expect(error.name).toBe('ApiError');
    });

    it('extracts detail from FastAPI structured format', () => {
      const error = new ApiError(400, 'Bad Request', '{"detail":{"message":"Invalid input"}}');
      expect(error.message).toBe('Invalid input');
      expect(error.detail).toBe('Invalid input');
    });

    it('extracts detail from plain JSON string body', () => {
      const error = new ApiError(500, 'Internal Server Error', '"Something went wrong"');
      expect(error.message).toBe('Something went wrong');
      expect(error.detail).toBe('Something went wrong');
    });

    it('falls back to raw text when body is not JSON', () => {
      const error = new ApiError(502, 'Bad Gateway', 'upstream connect error');
      expect(error.message).toBe('upstream connect error');
      expect(error.detail).toBe('upstream connect error');
    });

    it('falls back to HTTP status message when body is empty', () => {
      const error = new ApiError(404, 'Not Found', '');
      expect(error.message).toBe('HTTP 404: Not Found');
      expect(error.detail).toBeNull();
    });

    it('falls back to HTTP status message when body is whitespace', () => {
      const error = new ApiError(500, 'Internal Server Error', '   ');
      expect(error.message).toBe('HTTP 500: Internal Server Error');
      expect(error.detail).toBeNull();
    });

    it('handles JSON without detail field', () => {
      const error = new ApiError(400, 'Bad Request', '{"error":"something"}');
      expect(error.message).toBe('HTTP 400: Bad Request');
      expect(error.detail).toBeNull();
    });
  });

  describe('status helpers', () => {
    it('isUnauthorized returns true for 401', () => {
      const error = new ApiError(401, 'Unauthorized', '');
      expect(error.isUnauthorized).toBe(true);
      expect(error.isForbidden).toBe(false);
    });

    it('isForbidden returns true for 403', () => {
      const error = new ApiError(403, 'Forbidden', '');
      expect(error.isForbidden).toBe(true);
      expect(error.isUnauthorized).toBe(false);
    });

    it('isNotFound returns true for 404', () => {
      const error = new ApiError(404, 'Not Found', '');
      expect(error.isNotFound).toBe(true);
    });

    it('isConflict returns true for 409', () => {
      const error = new ApiError(409, 'Conflict', '');
      expect(error.isConflict).toBe(true);
    });

    it('isValidation returns true for 422', () => {
      const error = new ApiError(422, 'Unprocessable Entity', '');
      expect(error.isValidation).toBe(true);
    });

    it('all helpers return false for non-matching status', () => {
      const error = new ApiError(500, 'Internal Server Error', '');
      expect(error.isUnauthorized).toBe(false);
      expect(error.isForbidden).toBe(false);
      expect(error.isNotFound).toBe(false);
      expect(error.isConflict).toBe(false);
      expect(error.isValidation).toBe(false);
    });
  });

  it('is an instance of Error', () => {
    const error = new ApiError(500, 'Internal Server Error', '');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
  });
});
