import * as React from 'react';

import { Label } from '@horizon-sync/ui/components/ui/label';

interface DialogFieldGroupProps {
  title: string;
  children: React.ReactNode;
}

export function DialogFieldGroup({ title, children }: DialogFieldGroupProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{title}</h3>
      {children}
    </div>
  );
}

interface DialogFieldProps {
  label: string;
  htmlFor?: string;
  labelClassName?: string;
  children: React.ReactNode;
  className?: string;
}

export function DialogField({ 
  label, 
  htmlFor, 
  children, 
  labelClassName, 
  className = '' 
}: DialogFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={htmlFor} className={labelClassName}>
        {label}
      </Label>
      {children}
    </div>
  );
}