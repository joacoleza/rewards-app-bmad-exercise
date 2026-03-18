import { Users } from 'lucide-react';
import { useUsers } from './useUsers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  } catch {
    return dateString;
  }
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Table aria-busy="true" aria-label="Loading users">
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Created At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <div className="h-4 w-48 bg-[var(--color-border)] rounded animate-pulse" />
            </TableCell>
            <TableCell>
              <div className="h-5 w-20 bg-[var(--color-border)] rounded-full animate-pulse" />
            </TableCell>
            <TableCell>
              <div className="h-4 w-32 bg-[var(--color-border)] rounded animate-pulse" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function UsersPage() {
  const { data: users, isLoading, isError } = useUsers();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-[var(--color-text-muted)]">
            Manage user accounts and roles for your organization.
          </p>
        </div>
        {/* Add User button — functionality implemented in Story 2.3 */}
        <Button disabled aria-label="Add user (coming soon)">
          Add User
        </Button>
      </div>

      {isError && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 px-4 py-3 text-sm text-[var(--color-error)]"
        >
          Failed to load users. Please refresh the page and try again.
        </div>
      )}

      {isLoading && <TableSkeleton />}

      {!isLoading && !isError && users && users.length === 0 && (
        <EmptyState
          icon={<Users size={40} />}
          heading="No users in the system yet"
          description="Create your first user to get started onboarding your organization."
          actionLabel="Add User"
          actionDisabled
        />
      )}

      {!isLoading && !isError && users && users.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'manager' ? 'default' : 'info'}>
                    {user.role === 'manager' ? 'Manager' : 'Employee'}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
