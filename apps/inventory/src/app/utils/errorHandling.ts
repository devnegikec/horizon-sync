import type { ApiError } from '../utility/api/core';

/**
 * Error types for better error handling
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Structured error information
 */
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  userMessage: string;
  details?: unknown;
  canRetry: boolean;
}

/**
 * Parse API error and return structured error information
 */
export function parseApiError(error: unknown): ErrorInfo {
  // Network error (fetch failed)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: ErrorType.NETWORK,
      message: error.message,
      userMessage: 'Network error. Please check your connection and try again.',
      canRetry: true,
    };
  }

  // API error with status code
  if (isApiError(error)) {
    const status = error.status;
    const details = error.details;

    // Validation error (400)
    if (status === 400) {
      return {
        type: ErrorType.VALIDATION,
        message: error.message,
        userMessage: extractValidationMessage(details) || 'Invalid data. Please check your input.',
        details,
        canRetry: false,
      };
    }

    // Authorization error (401, 403)
    if (status === 401 || status === 403) {
      return {
        type: ErrorType.AUTHORIZATION,
        message: error.message,
        userMessage: status === 401 
          ? 'Your session has expired. Please log in again.' 
          : 'You do not have permission to perform this action.',
        canRetry: false,
      };
    }

    // Not found error (404)
    if (status === 404) {
      return {
        type: ErrorType.NOT_FOUND,
        message: error.message,
        userMessage: 'The requested resource was not found.',
        canRetry: false,
      };
    }

    // Conflict error (409)
    if (status === 409) {
      return {
        type: ErrorType.CONFLICT,
        message: error.message,
        userMessage: extractConflictMessage(details) || 'This operation conflicts with existing data.',
        details,
        canRetry: false,
      };
    }

    // Server error (500+)
    if (status >= 500) {
      return {
        type: ErrorType.SERVER,
        message: error.message,
        userMessage: 'Server error. Please try again later.',
        canRetry: true,
      };
    }
  }

  // Unknown error
  return {
    type: ErrorType.UNKNOWN,
    message: error instanceof Error ? error.message : String(error),
    userMessage: 'An unexpected error occurred. Please try again.',
    canRetry: true,
  };
}

/**
 * Type guard for API errors
 */
function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error
  );
}

/**
 * Extract validation message from error details
 */
function extractValidationMessage(details: unknown): string | null {
  if (!details || typeof details !== 'object') {
    return null;
  }

  // Handle FastAPI validation errors
  if ('detail' in details) {
    const detail = (details as { detail: unknown }).detail;
    
    // Array of validation errors
    if (Array.isArray(detail)) {
      const messages = detail.map((err: { msg?: string; loc?: string[] }) => {
        const field = err.loc ? err.loc.join('.') : 'field';
        return `${field}: ${err.msg || 'Invalid value'}`;
      });
      return messages.join(', ');
    }
    
    // Single error message
    if (typeof detail === 'string') {
      return detail;
    }
  }

  // Handle custom validation errors
  if ('message' in details && typeof (details as { message: unknown }).message === 'string') {
    return (details as { message: string }).message;
  }

  return null;
}

/**
 * Extract conflict message from error details
 */
function extractConflictMessage(details: unknown): string | null {
  if (!details || typeof details !== 'object') {
    return null;
  }

  if ('detail' in details && typeof (details as { detail: unknown }).detail === 'string') {
    return (details as { detail: string }).detail;
  }

  if ('message' in details && typeof (details as { message: unknown }).message === 'string') {
    return (details as { message: string }).message;
  }

  return null;
}

/**
 * Format error for toast notification
 */
export function formatErrorForToast(error: unknown): {
  title: string;
  description: string;
  variant: 'destructive';
} {
  const errorInfo = parseApiError(error);
  
  return {
    title: getErrorTitle(errorInfo.type),
    description: errorInfo.userMessage,
    variant: 'destructive',
  };
}

/**
 * Get error title based on error type
 */
function getErrorTitle(type: ErrorType): string {
  switch (type) {
    case ErrorType.NETWORK:
      return 'Connection Error';
    case ErrorType.VALIDATION:
      return 'Validation Error';
    case ErrorType.AUTHORIZATION:
      return 'Authorization Error';
    case ErrorType.NOT_FOUND:
      return 'Not Found';
    case ErrorType.CONFLICT:
      return 'Conflict Error';
    case ErrorType.SERVER:
      return 'Server Error';
    default:
      return 'Error';
  }
}

/**
 * Check if error can be retried
 */
export function canRetryError(error: unknown): boolean {
  const errorInfo = parseApiError(error);
  return errorInfo.canRetry;
}
