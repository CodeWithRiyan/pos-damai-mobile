import { useAuthStore } from '@/stores/auth';
import { useCallback, useState } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  username: string;
  selectedOrganizationId?: string;
  selectedOrganization?: { id: string; name: string; address?: string; phone?: string };
  roles?: Array<{ id: string; name: string; permissions: Array<{ name: string }> }>;
}

export const useAuth = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const profile = useAuthStore((state) => state.profile);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  return { isAuthenticated, profile, login, logout, loading: false };
};

export const useCurrentUser = () => {
  const profile = useAuthStore((state) => state.profile);
  return { data: profile, loading: false };
};

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const login = useAuthStore((state) => state.login);

  const mutate = useCallback(
    async (
      credentials: { username: string; password: string },
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        await login(credentials.username, credentials.password);
        options?.onSuccess?.();
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [login],
  );

  return { mutate, mutateAsync: mutate, loading, isPending: loading, error, isError: !!error };
}

export function useLogout() {
  const logout = useAuthStore((state) => state.logout);

  const mutate = useCallback(
    (_data?: undefined, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => {
      try {
        logout();
        options?.onSuccess?.();
      } catch (err) {
        const error = err as Error;
        options?.onError?.(error);
      }
    },
    [logout],
  );

  return { mutate, mutateAsync: mutate, logout };
}
