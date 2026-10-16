import * as React from 'react';

import { cn } from '../../lib';

interface ManagementContainerProps {
  children: React.ReactNode;
  /**
   * Extra classes merged onto the root element. The shared rhythm wins unless a
   * caller needs a screen-specific override.
   */
  className?: string;
}

/**
 * Standard root chrome for every `*Management` screen (WMS, Users, Roles, Items…).
 *
 * It owns the pieces every management screen must agree on so they don't drift
 * apart: the vertical rhythm between header, stat cards, filters and table, plus
 * the enter animation.
 *
 * Outer page padding is intentionally NOT applied here — the host layout owns it
 * (`DashboardLayout` renders its children inside a `p-6` wrapper). A screen that
 * adds its own padding wrapper on top of this container will look inset compared
 * to its siblings; that is exactly what made WMS double-pad. If you ever render a
 * management screen outside `DashboardLayout`, pass the padding in explicitly:
 * `<ManagementContainer className="p-6">`.
 */
export function ManagementContainer({ children, className }: ManagementContainerProps) {
  return (
    <div className={cn('space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500', className)}>
      {children}
    </div>
  );
}
