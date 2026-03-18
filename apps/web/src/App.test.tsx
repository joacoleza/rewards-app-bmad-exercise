import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { LoginPage } from '@/features/auth/LoginPage';

function createJsonResponse(body: unknown, init: { ok: boolean; status: number }) {
  return {
    ok: init.ok,
    status: init.status,
    json: vi.fn().mockResolvedValue(body),
  };
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(createJsonResponse({}, { ok: false, status: 401 })),
  );
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

function AuthStateProbe() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <p>Loading auth state</p>;
  }

  return <p>{user ? `${user.email}|${user.role}|${user.id}` : 'anonymous'}</p>;
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

  it('shows required field errors on submit and focuses the email field', async () => {
    renderWithProviders(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeDefined();
      expect(screen.getByText('Password is required')).toBeDefined();
    });

    expect(document.activeElement).toBe(screen.getByLabelText('Email'));
  });

  it('shows the required invalid credentials message for login failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(createJsonResponse({}, { ok: false, status: 401 }))
        .mockResolvedValueOnce(
          createJsonResponse(
            {
              error: 'UNAUTHORIZED',
              message: 'Custom backend message',
              field: null,
              statusCode: 401,
            },
            { ok: false, status: 401 },
          ),
        ),
    );

    renderWithProviders(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toBeDefined();
    });

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'admin@bmad.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain(
        'Invalid email or password',
      );
    });

    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe(
      'admin@bmad.com',
    );
    expect((screen.getByLabelText('Password') as HTMLInputElement).value).toBe(
      'password123',
    );
  });
});

describe('AuthProvider', () => {
  it('restores the full user, including email, from refresh', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(
        createJsonResponse(
          {
            accessToken: 'header.payload.signature',
            user: { id: 1, email: 'admin@bmad.com', role: 'manager' },
          },
          { ok: true, status: 200 },
        ),
      ),
    );

    renderWithProviders(<AuthStateProbe />);

    await waitFor(() => {
      expect(screen.getByText('admin@bmad.com|manager|1')).toBeDefined();
    });
  });
});
