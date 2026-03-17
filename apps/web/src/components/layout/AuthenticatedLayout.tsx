import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Sidebar } from './Sidebar';
import { Separator } from '@/components/ui/separator';
import { LogOut } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/nominate': 'Nominate a Peer',
  '/my-nominations': 'My Nominations',
  '/nominations': 'Pending Reviews',
  '/users': 'User Administration',
  '/audit': 'Audit Trail',
};

export function AuthenticatedLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const pageTitle = pageTitles[location.pathname] || 'Rewards App';

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 h-screen bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col"
        style={{ width: 'var(--sidebar-width)' }}
      >
        <div className="h-16 flex items-center px-6">
          <span className="text-lg font-semibold text-[var(--color-primary)]">
            Rewards App
          </span>
        </div>
        <Separator />
        <Sidebar currentPath={location.pathname} userRole={user.role} />
        <Separator />
        <div className="p-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-red-50 transition-colors"
            type="button"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Header */}
      <header
        className="h-16 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between px-8 fixed top-0 right-0 z-10"
        style={{ left: 'var(--sidebar-width)' }}
      >
        <h1 className="text-xl font-semibold text-[var(--color-text)]">
          {pageTitle}
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--color-text-muted)]">{user.email || 'User'}</span>
          <span className="inline-flex items-center rounded-full bg-[var(--color-primary-light)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-primary)] capitalize">
            {user.role}
          </span>
        </div>
      </header>

      {/* Main content */}
      <main
        className="pt-16 min-h-screen"
        style={{ marginLeft: 'var(--sidebar-width)' }}
      >
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
