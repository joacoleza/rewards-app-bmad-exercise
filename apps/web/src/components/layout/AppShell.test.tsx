import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from './AppShell';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

function renderWithRouter(ui: React.ReactElement, route = '/dashboard') {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}

// ── AppShell ──────────────────────────────────────────────────────────────────

describe('AppShell', () => {
  it('renders sidebar, header, and main content area', () => {
    renderWithRouter(
      <AppShell
        pageTitle="Dashboard"
        currentPath="/dashboard"
        userName="Alice"
        userRole="employee"
      >
        <div>Main Content</div>
      </AppShell>,
    );
    expect(screen.getByRole('navigation')).toBeDefined();
    expect(screen.getByRole('banner')).toBeDefined();
    expect(screen.getByRole('main')).toBeDefined();
    expect(screen.getByText('Main Content')).toBeDefined();
  });

  it('passes pageTitle to header', () => {
    renderWithRouter(
      <AppShell pageTitle="My Page" currentPath="/" userName="Bob" userRole="manager">
        <span />
      </AppShell>,
    );
    expect(screen.getByText('My Page')).toBeDefined();
  });

  it('passes userName to header', () => {
    renderWithRouter(
      <AppShell pageTitle="X" currentPath="/" userName="Charlie" userRole="employee">
        <span />
      </AppShell>,
    );
    expect(screen.getByText('Charlie')).toBeDefined();
  });
});

// ── Sidebar ───────────────────────────────────────────────────────────────────

describe('Sidebar', () => {
  it('renders employee nav items for employee role', () => {
    renderWithRouter(<Sidebar currentPath="/dashboard" userRole="employee" />);
    expect(screen.getByText('Dashboard')).toBeDefined();
    expect(screen.getByText('Nominate')).toBeDefined();
    expect(screen.getByText('My Nominations')).toBeDefined();
  });

  it('hides manager-only items for employee role', () => {
    renderWithRouter(<Sidebar currentPath="/dashboard" userRole="employee" />);
    expect(screen.queryByText('Pending Reviews')).toBeNull();
    expect(screen.queryByText('Users')).toBeNull();
    expect(screen.queryByText('Audit Trail')).toBeNull();
  });

  it('shows all nav items for manager role', () => {
    renderWithRouter(<Sidebar currentPath="/dashboard" userRole="manager" />);
    expect(screen.getByText('Dashboard')).toBeDefined();
    expect(screen.getByText('Nominate')).toBeDefined();
    expect(screen.getByText('My Nominations')).toBeDefined();
    expect(screen.getByText('Pending Reviews')).toBeDefined();
    expect(screen.getByText('Users')).toBeDefined();
    expect(screen.getByText('Audit Trail')).toBeDefined();
  });

  it('marks active item with indigo border class', () => {
    const { container } = renderWithRouter(
      <Sidebar currentPath="/dashboard" userRole="employee" />,
    );
    // The active link should have the indigo left border class
    const activeLink = container.querySelector('a[href="/dashboard"]');
    expect(activeLink).not.toBeNull();
    expect(activeLink!.className).toContain('border-l-[3px]');
    expect(activeLink!.className).toContain('border-[var(--color-primary)]');
  });

  it('does not mark inactive items as active', () => {
    const { container } = renderWithRouter(
      <Sidebar currentPath="/dashboard" userRole="employee" />,
    );
    const inactiveLink = container.querySelector('a[href="/nominate"]');
    expect(inactiveLink).not.toBeNull();
    expect(inactiveLink!.className).not.toContain('border-l-[3px]');
  });

  it('nav items are keyboard-reachable links', () => {
    const { container } = renderWithRouter(
      <Sidebar currentPath="/dashboard" userRole="employee" />,
    );
    const links = container.querySelectorAll('a');
    expect(links.length).toBeGreaterThanOrEqual(3);
    // Links are natively focusable (no tabIndex=-1 set)
    links.forEach((link) => {
      expect(link.getAttribute('tabindex')).not.toBe('-1');
    });
  });
});

// ── Header ────────────────────────────────────────────────────────────────────

describe('Header', () => {
  it('displays the page title', () => {
    render(<Header pageTitle="Approvals" userName="Dave" userRole="manager" />);
    expect(screen.getByText('Approvals')).toBeDefined();
  });

  it('displays the user name', () => {
    render(<Header pageTitle="X" userName="Eva" userRole="employee" />);
    expect(screen.getByText('Eva')).toBeDefined();
  });

  it('displays the user role badge', () => {
    render(<Header pageTitle="X" userName="Frank" userRole="manager" />);
    expect(screen.getByText('manager')).toBeDefined();
  });

  it('renders as a <header> element (landmark)', () => {
    render(<Header pageTitle="X" userName="G" userRole="employee" />);
    expect(screen.getByRole('banner')).toBeDefined();
  });
});
