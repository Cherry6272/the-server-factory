'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-ink transition hover:bg-brand hover:text-white dark:border dark:border-navy-700/80 dark:bg-navy-900 dark:text-gray-200 dark:hover:border-brand dark:hover:bg-brand dark:hover:text-white"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
