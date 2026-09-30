import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';

export const DEMO_USER: User = {
  id: 'a0000000-0000-0000-0000-000000000001',
  email: 'demo.analyst@cineforge.ai',
  full_name: 'Alex Mercer (Lead IDP Analyst)',
  role: 'admin'
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  loginAsDemo: () => void;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const token = localStorage.getItem('idp_auth_token');

      // 1. Instant fallback for Demo User (works offline / during Render cold-start)
      if (token === 'demo-token') {
        if (isMounted) {
          setUser(DEMO_USER);
          setLoading(false);
        }
        return;
      }

      // 2. Check Supabase OAuth Session
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && isMounted) {
            const su = session.user;
            setUser({
              id: su.id,
              email: su.email || 'authenticated@user.com',
              full_name: su.user_metadata?.full_name || su.user_metadata?.name || su.email?.split('@')[0] || 'Enterprise Analyst',
              role: 'admin',
              created_at: su.created_at
            });
            if (session.access_token) {
              localStorage.setItem('idp_auth_token', session.access_token);
            }
            setLoading(false);
            return;
          }
        } catch (supabaseErr) {
          console.warn('Supabase getSession check error:', supabaseErr);
        }
      }

      // 3. Fallback to API check if token exists
      if (token) {
        try {
          const { user: currentUser } = await api.auth.getMe();
          if (isMounted) {
            setUser(currentUser);
          }
        } catch (err) {
          console.warn('Token validation failed:', err);
          if (isMounted) {
            localStorage.removeItem('idp_auth_token');
            setUser(null);
          }
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    initAuth();

    // 4. Supabase Auth State Change Listener for OAuth redirect callbacks
    let authListenerSub: { unsubscribe: () => void } | null = null;
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const su = session.user;
          setUser({
            id: su.id,
            email: su.email || 'authenticated@user.com',
            full_name: su.user_metadata?.full_name || su.user_metadata?.name || su.email?.split('@')[0] || 'Enterprise Analyst',
            role: 'admin',
            created_at: su.created_at
          });
          if (session.access_token) {
            localStorage.setItem('idp_auth_token', session.access_token);
          }
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          const currentToken = localStorage.getItem('idp_auth_token');
          if (currentToken !== 'demo-token') {
            setUser(null);
            localStorage.removeItem('idp_auth_token');
          }
        }
      });
      authListenerSub = subscription;
    }

    return () => {
      isMounted = false;
      if (authListenerSub) {
        authListenerSub.unsubscribe();
      }
    };
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
    setUser(DEMO_USER);
  };

  const signInWithGoogle = async () => {
    if (!supabase) {
      throw new Error(
        'Supabase client is not initialized. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are properly configured.'
      );
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      throw error;
    }
  };

  const logout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }
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
        signInWithGoogle,
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
