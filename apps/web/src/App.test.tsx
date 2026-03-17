import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/features/auth/AuthContext';
import { LoginPage } from '@/features/auth/LoginPage';

// Mock fetch globally
beforeEach(() => {
  // Mock refresh call to fail (user not authenticated)
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
});

function renderWithProviders(ui: React.ReactElement, { route = '/login' } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>{ui}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LoginPage', () => {
  it('renders the login form', async () => {
    renderWithProviders(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByText('Sign in to your account')).toBeDefined();
    });
    expect(screen.getByLabelText('Email')).toBeDefined();
    expect(screen.getByLabelText('Password')).toBeDefined();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDefined();
  });

  it('shows Rewards App branding', async () => {
    renderWithProviders(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByText('Rewards App')).toBeDefined();
    });
  });

  it('has submit button disabled when fields are empty', async () => {
    renderWithProviders(<LoginPage />);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /sign in/i });
      expect(button).toBeDefined();
      expect(button.hasAttribute('disabled')).toBe(true);
    });
  });
});
