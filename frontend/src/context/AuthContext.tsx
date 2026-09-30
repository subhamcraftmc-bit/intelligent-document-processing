import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  loginAsDemo: () => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('idp_auth_token');
      if (!token) {
        // Automatically give seamless analyst guest access for smooth evaluation if desired, or keep as null
        // Let's set default demo session if token was previously set to demo-token
        setLoading(false);
        return;
      }

      try {
        const { user: currentUser } = await api.auth.getMe();
        setUser(currentUser);
      } catch (err) {
        console.warn('Session check warning:', err);
        // If demo token, create demo user
        if (token === 'demo-token') {
          setUser({
            id: 'a0000000-0000-0000-0000-000000000001',
            email: 'demo.analyst@cineforge.ai',
            full_name: 'Alex Mercer (Lead IDP Analyst)',
            role: 'admin'
          });
        } else {
          localStorage.removeItem('idp_auth_token');
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await api.auth.login(email, password);
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName?: string) => {
    setLoading(true);
    try {
      const data = await api.auth.register(email, password, fullName);
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = () => {
    localStorage.setItem('idp_auth_token', 'demo-token');
    setUser({
      id: 'a0000000-0000-0000-0000-000000000001',
      email: 'demo.analyst@cineforge.ai',
      full_name: 'Alex Mercer (Lead IDP Analyst)',
      role: 'admin'
    });
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginAsDemo,
        logout,
        isAuthenticated: Boolean(user)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
