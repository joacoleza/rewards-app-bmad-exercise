import * as React from 'react';
import { Button } from '@/components/ui/button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  heading: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}

export function EmptyState({
  icon,
  heading,
  description,
  actionLabel,
  onAction,
  actionDisabled,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="mb-4 text-[var(--color-text-muted)]" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-[var(--color-text)]">{heading}</h3>
      <p className="mt-1 text-sm text-[var(--color-text-muted)] max-w-sm">{description}</p>
      {actionLabel && (
        <Button className="mt-4" onClick={onAction} disabled={actionDisabled || !onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
