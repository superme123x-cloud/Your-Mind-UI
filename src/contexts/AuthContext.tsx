import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api/client';

interface AuthContextType {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('lifeos_token'));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('lifeos_username'));

  useEffect(() => {
    if (token) localStorage.setItem('lifeos_token', token);
    else localStorage.removeItem('lifeos_token');
  }, [token]);

  useEffect(() => {
    if (username) localStorage.setItem('lifeos_username', username);
    else localStorage.removeItem('lifeos_username');
  }, [username]);

  const handleAuthResponse = (data: { token: string; username: string }) => {
    setToken(data.token);
    setUsername(data.username);
  };

  const login = async (u: string, p: string) => {
    const res = await authApi.login({ username: u, password: p });
    handleAuthResponse(res.data);
  };

  const register = async (u: string, p: string) => {
    const res = await authApi.register({ username: u, password: p });
    handleAuthResponse(res.data);
  };

  const logout = () => {
    setToken(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        username,
        isAuthenticated: !!token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}