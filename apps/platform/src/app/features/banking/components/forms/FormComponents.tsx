import React from 'react';
import { Label } from '@horizon-sync/ui/components/ui/label';

// Simple form components to replace missing Form components
export const FormField: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={className}>
    {children}
  </div>
);

export const FormItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "space-y-2" }) => (
  <div className={className}>
    {children}
  </div>
);

export const FormLabel: React.FC<{
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}> = ({ children, className, htmlFor }) => (
  <Label className={className} htmlFor={htmlFor}>
    {children}
  </Label>
);

export const FormControl: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={className}>
    {children}
  </div>
);

export const FormMessage: React.FC<{
  children?: React.ReactNode;
  className?: string;
}> = ({ children, className = "text-sm text-red-600" }) => (
  children ? <p className={className}>{children}</p> : null
);

export const Form: React.FC<{
  children: React.ReactNode;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  className?: string;
}> = ({ children, onSubmit, className }) => (
  <form onSubmit={onSubmit} className={className}>
    {children}
  </form>
);