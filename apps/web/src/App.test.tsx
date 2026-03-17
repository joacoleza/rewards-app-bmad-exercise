import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders the app shell with sidebar', () => {
    render(<App />);
    expect(screen.getByText('Rewards App')).toBeDefined();
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
  });

  it('renders navigation items for employees', () => {
    render(<App />);
    expect(screen.getByText('Nominate')).toBeDefined();
    expect(screen.getByText('My Nominations')).toBeDefined();
  });
});
