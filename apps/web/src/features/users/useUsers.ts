import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface UserRecord {
  id: number;
  email: string;
  role: 'employee' | 'manager';
  createdAt: string;
}

export const USERS_QUERY_KEY = ['users'] as const;

export function useUsers() {
  return useQuery<UserRecord[]>({
    queryKey: USERS_QUERY_KEY,
    queryFn: () => api.get<UserRecord[]>('/users'),
  });
}
