import * as React from 'react';

import { ShieldOff } from 'lucide-react';

import { cn } from '../../lib';
import { Card, CardContent } from '../ui/card';

export type NoPermissionVariant = 'page' | 'card' | 'inline';

export interface NoPermissionProps {
  /**
   * Optional module/area name, e.g. "Returns" — folded into the default copy so
   * the message says *what* the user cannot access.
   */
  module?: string;
  title?: string;
  description?: string;
  /** Override the default shield icon. */
  icon?: React.ReactNode;
  /** Optional call to action (e.g. a "Back to dashboard" button). */
  action?: React.ReactNode;
  /**
   * Layout:
   * - `page`   — centred, fills the content area (default; for a blocked page/route)
   * - `card`   — the page layout wrapped in a `Card` (for a blocked tab/section)
   * - `inline` — compact, no card (for a blocked panel inside a larger view)
   */
  variant?: NoPermissionVariant;
  className?: string;
}

interface VariantStyles {
  container: string;
  iconWrap: string;
  icon: string;
  title: string;
}

const VARIANT_STYLES: Record<NoPermissionVariant, VariantStyles> = {
  page: {
    container: 'gap-3 py-16 px-6',
    iconWrap: 'h-14 w-14',
    icon: 'h-7 w-7',
    title: 'text-lg',
  },
  card: {
    container: 'gap-3 py-14 px-6',
    iconWrap: 'h-14 w-14',
    icon: 'h-7 w-7',
    title: 'text-lg',
  },
  inline: {
    container: 'gap-2 py-8 px-4',
    iconWrap: 'h-10 w-10',
    icon: 'h-5 w-5',
    title: 'text-base',
  },
};

function defaultDescription(module?: string): string {
  return module
    ? `You don't have permission to view ${module}. Contact your administrator to request access.`
    : "You don't have permission to view this. Contact your administrator to request access.";
}

/**
 * `NoPermission` — the single "you can't see this" surface used across the app.
 *
 * Prefer this over ad-hoc red text or one-off empty states so permission denials
 * look and read the same everywhere (route guards, module tabs, blocked panels).
 */
export function NoPermission({
  module,
  title = 'No permission',
  description,
  icon,
  action,
  variant = 'page',
  className,
}: NoPermissionProps) {
  const styles = VARIANT_STYLES[variant];

  const content = (
    <div className={cn('flex flex-col items-center justify-center text-center', styles.container, className)}>
      <div className={cn('flex items-center justify-center rounded-full bg-muted text-muted-foreground', styles.iconWrap)}>
        {icon ?? <ShieldOff className={styles.icon} />}
      </div>
      <div className="space-y-1">
        <h3 className={cn('font-semibold tracking-tight', styles.title)}>{title}</h3>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description ?? defaultDescription(module)}</p>
      </div>
      {action ?? null}
    </div>
  );

  if (variant === 'card') {
    return (
      <Card>
        <CardContent className="p-0">{content}</CardContent>
      </Card>
    );
  }

  return content;
}
