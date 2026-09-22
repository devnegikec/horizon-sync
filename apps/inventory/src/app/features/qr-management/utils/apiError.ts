interface ApiErrorDetail {
  message?: unknown;
}

interface AxiosLikeError {
  response?: {
    data?: {
      detail?: unknown;
    };
  };
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const detail = (error as AxiosLikeError | null)?.response?.data?.detail;
  return (
    getNonEmptyString(detail) ??
    getObjectMessage(detail) ??
    getValidationMessage(detail) ??
    fallback
  );
}

function getNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function getObjectMessage(detail: unknown): string | null {
  if (!detail || typeof detail !== 'object' || Array.isArray(detail)) return null;
  return getNonEmptyString((detail as ApiErrorDetail).message);
}

function getValidationMessage(detail: unknown): string | null {
  if (!Array.isArray(detail)) return null;
  const messages = detail
    .map((item) =>
      item && typeof item === 'object' && 'msg' in item
        ? getNonEmptyString(String(item.msg))
        : null,
    )
    .filter((message): message is string => message !== null);
  return messages.length > 0 ? messages.join(', ') : null;
}
