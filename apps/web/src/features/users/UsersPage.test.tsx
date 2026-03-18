import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UsersPage } from './UsersPage';

// Mock the useUsers hook to decouple component tests from fetch/auth
vi.mock('./useUsers', () => ({
  useUsers: vi.fn(),
  USERS_QUERY_KEY: ['users'],
}));

// Import AFTER vi.mock so we get the mocked version
import { useUsers } from './useUsers';

const mockUsers = [
  { id: 1, email: 'manager@example.com', role: 'manager', createdAt: '2026-03-01T00:00:00.000Z' },
  { id: 2, email: 'employee@example.com', role: 'employee', createdAt: '2026-03-02T00:00:00.000Z' },
];

function renderUsersPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/users']}>
        <UsersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  // Default: data loaded successfully
  vi.mocked(useUsers).mockReturnValue({
    data: mockUsers,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useUsers>);
});

describe('UsersPage', () => {
  describe('loading state', () => {
    it('shows skeleton loader while data is loading', () => {
      vi.mocked(useUsers).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
      } as unknown as ReturnType<typeof useUsers>);

      renderUsersPage();

      const skeletonCells = document.querySelectorAll('.animate-pulse');
      expect(skeletonCells.length).toBeGreaterThan(0);
    });

    it('does not show a full-page loading screen', () => {
      vi.mocked(useUsers).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
      } as unknown as ReturnType<typeof useUsers>);

      renderUsersPage();

      expect(screen.queryByText(/loading\.\.\./i)).toBeNull();
    });
  });

  describe('data loaded state', () => {
    it('renders a semantic table after data loads', () => {
      renderUsersPage();
      expect(screen.getByRole('table')).toBeDefined();
    });

    it('displays Email, Role, and Created At column headers', () => {
      renderUsersPage();
      expect(screen.getByText('Email')).toBeDefined();
      expect(screen.getByText('Role')).toBeDefined();
      expect(screen.getByText('Created At')).toBeDefined();
    });

    it('renders each user email in the table', () => {
      renderUsersPage();
      expect(screen.getByText('manager@example.com')).toBeDefined();
      expect(screen.getByText('employee@example.com')).toBeDefined();
    });

    it('displays role as a Badge for each user', () => {
      renderUsersPage();
      expect(screen.getByText('Manager')).toBeDefined();
      expect(screen.getByText('Employee')).toBeDefined();
    });

    it('formats the createdAt date for display', () => {
      renderUsersPage();
      expect(screen.getByText('Mar 1, 2026')).toBeDefined();
    });

    it('displays "Add User" button', () => {
      renderUsersPage();
      expect(screen.getByRole('button', { name: /add user/i })).toBeDefined();
    });

    it('uses semantic HTML table structure with thead and tbody', () => {
      renderUsersPage();
      expect(screen.getByRole('table')).toBeDefined();
      const rowGroups = screen.getAllByRole('rowgroup');
      // thead and tbody both have role="rowgroup"
      expect(rowGroups.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('empty state', () => {
    beforeEach(() => {
      vi.mocked(useUsers).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
      } as unknown as ReturnType<typeof useUsers>);
    });

    it('shows EmptyState heading when user list is empty', () => {
      renderUsersPage();
      expect(screen.getByText('No users in the system yet')).toBeDefined();
    });

    it('shows EmptyState CTA button as disabled when list is empty', () => {
      renderUsersPage();
      // Both the header button and the EmptyState CTA should be present and disabled
      const addUserButtons = screen.getAllByRole('button', { name: /add user/i });
      expect(addUserButtons.length).toBeGreaterThanOrEqual(2);
      addUserButtons.forEach((btn) => {
        expect(btn).toHaveProperty('disabled', true);
      });
    });

    it('does not render the table when list is empty', () => {
      renderUsersPage();
      expect(screen.getByText('No users in the system yet')).toBeDefined();
      expect(screen.queryByRole('table')).toBeNull();
    });
  });

  describe('error state', () => {
    it('shows error message when API fails', () => {
      vi.mocked(useUsers).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
      } as unknown as ReturnType<typeof useUsers>);

      renderUsersPage();

      const alert = screen.getByRole('alert');
      expect(alert).toBeDefined();
      expect(alert.textContent).toContain('Failed to load users');
    });

    it('does not show the table when in error state', () => {
      vi.mocked(useUsers).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
      } as unknown as ReturnType<typeof useUsers>);

      renderUsersPage();

      expect(screen.queryByRole('table')).toBeNull();
    });
  });
});
