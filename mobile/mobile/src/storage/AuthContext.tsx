import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMe } from '@/api/auth';

type AuthContextValue = {
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Temporarily skip auth check on startup due to CORS
    // TODO: Fix CORS in backend, then restore this:
    // fetchMe()
    //   .then(() => setAuthenticated(true))
    //   .catch(() => setAuthenticated(false))
    //   .finally(() => setLoading(false));
    
    setAuthenticated(false);
    setLoading(false);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, setAuthenticated, loading }),
    [isAuthenticated, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


