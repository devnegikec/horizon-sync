import type { ApiFieldError, NormalizedApiError } from '../../utility/api/core';

/** The field-level problem the API reported for one input, if any. */
export function fieldIssue(error: NormalizedApiError | null, field: string): ApiFieldError | undefined {
  return error?.fields.find((issue) => issue.field === field);
}

/** Field-level problem plus the server's suggested fix, under the input. */
export function FieldError({ issue }: { issue?: ApiFieldError }) {
  if (!issue) return null;
  return (
    <p className="text-xs text-destructive">
      {issue.message ?? issue.reason}
      {issue.hint ? <span className="mt-0.5 block text-muted-foreground">{issue.hint}</span> : null}
    </p>
  );
}
