const API_BASE = '/api';

export const AUTH_EXPIRED_EVENT = 'auth:expired';

export interface ApiError {
  error: string;
  message: string;
  field: string | null;
  statusCode: number;
}

export interface AuthUser {
  id: number;
  email: string;
  role: 'employee' | 'manager';
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body: ApiError = await response.json().catch(() => ({
      error: 'NETWORK_ERROR',
      message: 'Network error',
      field: null,
      statusCode: response.status,
    }));
    throw body;
  }
  return response.json();
}

function dispatchAuthExpired() {
  setAccessToken(null);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
}

export async function refreshSessionApi(): Promise<AuthSession | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;

    const session = (await res.json()) as AuthSession;
    setAccessToken(session.accessToken);

    return session;
  } catch {
    return null;
  }
}

async function fetchWithAuth<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Auto-refresh on 401
  if (response.status === 401 && accessToken) {
    const session = await refreshSessionApi();
    if (session) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
      response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    } else {
      dispatchAuthExpired();
    }
  }

  return handleResponse<T>(response);
}

export const api = {
  get: <T>(url: string) => fetchWithAuth<T>(url),
  post: <T>(url: string, body?: unknown) =>
    fetchWithAuth<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(url: string, body?: unknown) =>
    fetchWithAuth<T>(url, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
};

// Login — public endpoint (no auth header needed)
export async function loginApi(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<AuthSession>(res);
}

// Logout
export async function logoutApi() {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  setAccessToken(null);
}
