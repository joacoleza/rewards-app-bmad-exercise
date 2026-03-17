import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { loginApi, logoutApi, setAccessToken } from '@/lib/api';

interface AuthUser {
  id: number;
  email: string;
  role: 'employee' | 'manager';
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Try to restore session from refresh token on mount
  useEffect(() => {
    async function tryRestore() {
      try {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        if (res.ok) {
          const { accessToken } = await res.json();
          setAccessToken(accessToken);
          // Decode JWT to get user info (base64 payload)
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          setUser({ id: payload.sub, email: '', role: payload.role });
        }
      } catch {
        // No valid session — stay unauthenticated
      } finally {
        setIsLoading(false);
      }
    }
    tryRestore();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginApi(email, password);
    setAccessToken(result.accessToken);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
