'use client';
import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import type { ThemeContextValue } from '@/types';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const themeListeners = new Set<() => void>();

function subscribeToTheme(onStoreChange: () => void) {
  themeListeners.add(onStoreChange);

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const handleMediaChange = () => onStoreChange();
  const handleStorage = (event: StorageEvent) => {
    if (event.key === 'theme') onStoreChange();
  };

  media.addEventListener('change', handleMediaChange);
  window.addEventListener('storage', handleStorage);

  return () => {
    themeListeners.delete(onStoreChange);
    media.removeEventListener('change', handleMediaChange);
    window.removeEventListener('storage', handleStorage);
  };
}

function notifyThemeListeners() {
  themeListeners.forEach((listener) => listener());
}

function readStoredTheme(): 'light' | 'dark' {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    return 'light';
  }
  return 'light';
}

function getServerThemeSnapshot(): 'light' | 'dark' {
  return 'light';
}

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    readStoredTheme,
    getServerThemeSnapshot,
  );

  useEffect(() => {
    localStorage.setItem('theme', 'light');
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = 'light';
    localStorage.setItem('theme', nextTheme);
    notifyThemeListeners();
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
