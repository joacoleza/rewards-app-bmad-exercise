import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders with default (primary) variant', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button', { name: 'Click me' });
    expect(btn).toBeDefined();
    expect(btn.className).toContain('bg-[var(--color-primary)]');
    expect(btn.className).toContain('text-white');
  });

  it('renders secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const btn = screen.getByRole('button', { name: 'Secondary' });
    expect(btn.className).toContain('border-[var(--color-primary)]');
    expect(btn.className).toContain('text-[var(--color-primary)]');
  });

  it('renders destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>);
    const btn = screen.getByRole('button', { name: 'Delete' });
    expect(btn.className).toContain('bg-[var(--color-error)]');
    expect(btn.className).toContain('text-white');
  });

  it('renders ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole('button', { name: 'Ghost' });
    expect(btn.className).toContain('text-[var(--color-text-muted)]');
  });

  it('applies focus-visible ring classes for keyboard accessibility', () => {
    render(<Button>Focusable</Button>);
    const btn = screen.getByRole('button', { name: 'Focusable' });
    expect(btn.className).toContain('focus-visible:ring-2');
    expect(btn.className).toContain('focus-visible:ring-[var(--color-focus)]');
    expect(btn.className).toContain('focus-visible:ring-offset-2');
  });

  it('default size applies 40px height (h-10)', () => {
    render(<Button>Default Size</Button>);
    const btn = screen.getByRole('button', { name: 'Default Size' });
    expect(btn.className).toContain('h-10');
  });

  it('is disabled when disabled prop is passed', () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole('button', { name: 'Disabled' });
    expect(btn.hasAttribute('disabled')).toBe(true);
    expect(btn.className).toContain('disabled:opacity-50');
  });

  it('renders all four variants without throwing', () => {
    const variants = ['default', 'secondary', 'destructive', 'ghost'] as const;
    variants.forEach((variant) => {
      const { unmount } = render(<Button variant={variant}>{variant}</Button>);
      expect(screen.getByRole('button', { name: variant })).toBeDefined();
      unmount();
    });
  });
});
