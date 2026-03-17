import { cn } from '@/lib/utils';

function Separator({ className, orientation = 'horizontal', ...props }: {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="separator"
      className={cn(
        'shrink-0 bg-[var(--color-border)]',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
