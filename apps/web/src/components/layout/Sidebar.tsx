import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Star,
  ClipboardList,
  Clock,
  Users,
  FileSearch,
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
    <nav className="flex-1 py-4 overflow-y-auto">
      <ul className="space-y-1 px-3">
        {visibleItems.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <li key={item.href}>
              <Link
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-l-[3px] border-[var(--color-primary)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-slate-100',
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
