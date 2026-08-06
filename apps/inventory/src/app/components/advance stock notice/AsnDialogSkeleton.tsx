import * as React from 'react';

/**
 * Skeleton loader for the ASN Order view/edit dialog.
 * Matches the exact layout of the real form (90vw × 90vh dialog).
 */
export function AsnDialogSkeleton() {
  return (
    <div className="space-y-6 animate-pulse flex-1 min-h-0">
      {/* Basic Information section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-transparent bg-muted rounded w-40">&nbsp;</h3>
        {/* Row 1: ASN#, By, For */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-20" />
            <div className="h-10 bg-muted rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-8" />
            <div className="h-10 bg-muted rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-8" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </div>
        {/* Row 2: Order Date, Delivery Date, Status */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-10 bg-muted rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-10 bg-muted rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-12" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </div>
        {/* Row 3: Remarks */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-16" />
          <div className="h-20 bg-muted rounded" />
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Line Items section */}
      <div className="space-y-4">
        <div className="h-4 bg-muted rounded w-24" />
        {/* Toolbar placeholders */}
        <div className="flex gap-2">
          <div className="h-9 bg-muted rounded w-28" />
          <div className="h-9 bg-muted rounded w-20" />
        </div>
        {/* Table skeleton */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 flex gap-8">
            <div className="h-3 bg-muted rounded w-16" />
            <div className="h-3 bg-muted rounded w-16" />
            <div className="h-3 bg-muted rounded w-12" />
            <div className="h-3 bg-muted rounded w-12" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-4 py-3 border-t flex gap-8">
              <div className="h-4 bg-muted rounded w-32" />
              <div className="h-4 bg-muted rounded w-40" />
              <div className="h-4 bg-muted rounded w-12" />
              <div className="h-4 bg-muted rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
