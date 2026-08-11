import { AlertTriangle } from 'lucide-react';

import { Card, CardContent } from '@horizon-sync/ui/components';

interface ErrorBannerProps {
  /** The entity name shown in the message, e.g. "invoices", "payments" */
  entity: string;
  /** The error message (already user-friendly from getFriendlyErrorMessage) */
  message: string;
}

/**
 * Consistent error banner used across all management pages.
 * Displays: "Error loading {entity}: {message}"
 */
export function ErrorBanner({ entity, message }: ErrorBannerProps) {
  return (
    <Card className="border-destructive">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">
            Error loading {entity}: {message}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
