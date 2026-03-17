interface HeaderProps {
  pageTitle: string;
  userName: string;
  userRole: 'employee' | 'manager';
}

export function Header({ pageTitle, userName, userRole }: HeaderProps) {
  return (
    <header
      className="h-16 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between px-8"
      style={{ marginLeft: 'var(--sidebar-width)' }}
    >
      <h1 className="text-xl font-semibold text-[var(--color-text)]">
        {pageTitle}
      </h1>
      <div className="flex items-center gap-3">
        <span className="text-sm text-[var(--color-text-muted)]">{userName}</span>
        <span className="inline-flex items-center rounded-full bg-[var(--color-primary-light)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-primary)] capitalize">
          {userRole}
        </span>
      </div>
    </header>
  );
}
