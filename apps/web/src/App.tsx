import { AppShell } from '@/components/layout/AppShell';

export function App() {
  return (
    <AppShell
      pageTitle="Dashboard"
      currentPath="/dashboard"
      userName="User"
      userRole="employee"
    >
      <div className="text-[var(--color-text-muted)]">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          Welcome to Rewards App
        </h2>
        <p>Select a page from the sidebar to get started.</p>
      </div>
    </AppShell>
  );
}
