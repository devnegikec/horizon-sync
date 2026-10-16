import * as React from 'react';

import { cn } from '@horizon-sync/ui/lib';

interface SectionTabProps {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}

/** Pill tab used by the Inbound and Manage section switchers. */
export function SectionTab({ active, icon: Icon, label, onClick }: SectionTabProps) {
  return (
    <button className={cn('px-4 py-2 text-sm font-medium', active ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted')}
      onClick={onClick}>
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </span>
    </button>
  );
}
