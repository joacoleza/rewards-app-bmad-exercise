import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Star,
  ClipboardList,
  Clock,
  Users,
  FileSearch,
  LogOut,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  managerOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Nominate', href: '/nominate', icon: <Star size={20} /> },
  { label: 'My Nominations', href: '/my-nominations', icon: <ClipboardList size={20} /> },
  { label: 'Pending Reviews', href: '/nominations', icon: <Clock size={20} />, managerOnly: true },
  { label: 'Users', href: '/users', icon: <Users size={20} />, managerOnly: true },
  { label: 'Audit Trail', href: '/audit', icon: <FileSearch size={20} />, managerOnly: true },
];

interface SidebarProps {
  currentPath: string;
  userRole: 'employee' | 'manager';
}

export function Sidebar({ currentPath, userRole }: SidebarProps) {
  const visibleItems = navItems.filter(
    (item) => !item.managerOnly || userRole === 'manager',
  );

  return (
    <aside
      className="fixed left-0 top-0 h-screen bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col"
      style={{ width: 'var(--sidebar-width)' }}
    >
      {/* Logo area */}
      <div className="h-16 flex items-center px-6">
        <span className="text-lg font-semibold text-[var(--color-primary)]">
          Rewards App
        </span>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {visibleItems.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-l-[3px] border-[var(--color-primary)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-slate-100',
                  )}
                >
                  {item.icon}
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <Separator />

      {/* Logout at bottom */}
      <div className="p-3">
        <button
          className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-red-50 transition-colors"
          type="button"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}
