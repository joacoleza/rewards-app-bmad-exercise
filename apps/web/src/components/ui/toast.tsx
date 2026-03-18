import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const toastVariants = cva(
  'pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-md text-sm',
  {
    variants: {
      variant: {
        default: 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]',
        success: 'border-green-200 bg-green-50 text-green-900',
        error: 'border-red-200 bg-red-50 text-red-900',
        warning: 'border-amber-200 bg-amber-50 text-amber-900',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  title?: string;
  description?: string;
  onClose?: () => void;
}

function Toast({ className, variant, title, description, onClose, ...props }: ToastProps) {
  return (
    <div role="alert" aria-live="assertive" className={cn(toastVariants({ variant }), className)} {...props}>
      <div className="flex-1">
        {title && <p className="font-medium">{title}</p>}
        {description && <p className="text-[var(--color-text-muted)] mt-0.5">{description}</p>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function ToastContainer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80', className)}
      {...props}
    />
  );
}

export { Toast, ToastContainer, toastVariants };
