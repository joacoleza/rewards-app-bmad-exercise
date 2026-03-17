import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/features/auth/AuthContext';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { NominatePage } from '@/features/nominations/NominatePage';
import { MyNominationsPage } from '@/features/nominations/MyNominationsPage';
import { NominationsQueuePage } from '@/features/approvals/NominationsQueuePage';
import { UsersPage } from '@/features/users/UsersPage';
import { AuditPage } from '@/features/audit/AuditPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected */}
            <Route
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/nominate" element={<NominatePage />} />
              <Route path="/my-nominations" element={<MyNominationsPage />} />

              {/* Manager-only */}
              <Route
                path="/nominations"
                element={
                  <ProtectedRoute requiredRole="manager">
                    <NominationsQueuePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute requiredRole="manager">
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit"
                element={
                  <ProtectedRoute requiredRole="manager">
                    <AuditPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
