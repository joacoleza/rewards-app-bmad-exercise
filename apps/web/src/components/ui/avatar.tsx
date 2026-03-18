import * as React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

function Avatar({ src, alt, fallback, size = 'md', className, ...props }: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium select-none overflow-hidden',
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={alt ?? ''}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span aria-hidden="true">{fallback ?? '?'}</span>
      )}
    </span>
  );
}

export { Avatar };
