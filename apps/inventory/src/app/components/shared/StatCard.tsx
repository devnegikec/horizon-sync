import React from 'react';

import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { cn } from '@horizon-sync/ui/lib';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  comparison?: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
}

export function StatCard({ title, value, icon: Icon, iconBg, iconColor, comparison, onClick, ariaLabel }: StatCardProps) {
  return (
    <Card
      className={cn('border-border hover:shadow-md transition-shadow', onClick && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring')}
      onClick={onClick}
      onKeyDown={onClick ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      } : undefined}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-label={ariaLabel}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {comparison}
          </div>
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', iconBg)}>
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
