import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, ...props }, ref) => {
    return <form ref={ref} className={cn('space-y-4', className)} {...props} />;
  }
);
Form.displayName = 'Form';

export interface FormFieldProps {
  className?: string;
  children: React.ReactNode;
}

export function FormField({ className, children }: FormFieldProps) {
  return <div className={cn('space-y-2', className)}>{children}</div>;
}

export interface FormErrorProps {
  className?: string;
  children: React.ReactNode;
}

export function FormError({ className, children }: FormErrorProps) {
  if (!children) return null;
  return (
    <p className={cn('text-sm font-medium text-destructive', className)}>
      {children}
    </p>
  );
}

