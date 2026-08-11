import * as React from 'react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';

interface InfoRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'destructive' | 'secondary';
  };
  testId?: string;
}

export function InfoRow({ icon: Icon, label, value, badge, testId }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0" data-testid={testId}>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-muted-foreground" data-testid={testId ? `${testId}-value` : undefined}>{value || 'Not set'}</p>
        </div>
      </div>
      {badge && <Badge variant={badge.variant}>{badge.text}</Badge>}
    </div>
  );
}
