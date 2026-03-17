import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppShellProps {
  children: React.ReactNode;
  pageTitle: string;
  currentPath: string;
  userName: string;
  userRole: 'employee' | 'manager';
}

export function AppShell({
  children,
  pageTitle,
  currentPath,
  userName,
  userRole,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Sidebar currentPath={currentPath} userRole={userRole} />
      <Header
        pageTitle={pageTitle}
        userName={userName}
        userRole={userRole}
      />
      <main
        className="pt-16 min-h-screen"
        style={{ marginLeft: 'var(--sidebar-width)' }}
      >
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
