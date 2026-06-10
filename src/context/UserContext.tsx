'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getProfile } from '../services/api';
import { clearAuthCookie, setAuthCookie } from '../lib/auth-cookies';
import type { ApiError, User, UserContextValue } from '@/types';

const UserContext = createContext<UserContextValue | undefined>(undefined);

export const useUser = (): UserContextValue => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarVersion, setAvatarVersion] = useState(0);

  const logout = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    clearAuthCookie();
    sessionStorage.removeItem('welcomeToastShown');
    setUser(null);
    window.location.href = '/login';
  };

  const fetchUser = async (silent = false) => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      if (!silent) setLoading(true);
      const data = await getProfile();
      setUser(data);
    } catch (error: unknown) {
      console.error('Failed to fetch user profile:', error);
      const apiError = error as ApiError;
      const status = apiError.statusCode || apiError.status;
      if (status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const bumpAvatarVersion = () => setAvatarVersion((v) => v + 1);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthCookie(token);
    }
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <UserContext.Provider value={{
      user,
      loading,
      avatarVersion,
      refreshUser: () => fetchUser(true),
      bumpAvatarVersion,
      logout,
    }}>
      {children}
    </UserContext.Provider>
  );
};
