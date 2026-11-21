import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { User, DemoUser } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  demoUsers: DemoUser[];
  login: (email: string, password?: string) => Promise<void>;
  demoSwitch: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);

  useEffect(() => {
    loadCurrentUser();
    loadDemoUsers();
  }, []);

  const loadCurrentUser = async () => {
    const token = localStorage.getItem('certiflow_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch (e) {
      console.warn('Failed to restore session:', e);
      localStorage.removeItem('certiflow_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadDemoUsers = async () => {
    try {
      const res = await api.get('/auth/demo-users');
      setDemoUsers(res.data.demoUsers);
    } catch (e) {
      console.warn('Failed to load demo users:', e);
    }
  };

  const login = async (email: string, password = 'Demo@123') => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('certiflow_token', res.data.token);
      setUser(res.data.user);
    } finally {
      setLoading(false);
    }
  };

  const demoSwitch = async (email: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/demo-switch', { email });
      localStorage.setItem('certiflow_token', res.data.token);
      setUser(res.data.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('certiflow_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, demoUsers, login, demoSwitch, logout }}>
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

