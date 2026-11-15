'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(null);
const STORAGE_KEY = 'serverfactory_theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Dark is the default. Hydration-safe default = dark.
  const [theme, setTheme] = useState<Theme>('dark');

  // On mount, clear legacy light key and read user preference; default to dark if unset
  useEffect(() => {
    try {
      localStorage.removeItem('serverfactory.theme');
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored === 'light') {
        setTheme('light');
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      } else {
        setTheme('dark');
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      }
    } catch {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    }
  }, []);

  // Reflect theme on <html> element and colorScheme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  function toggle() {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
