'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutUser } from '@/lib/logout';
import {
  LayoutDashboard, Package, Tag, ShoppingBag, Users, LayoutPanelLeft,
  SlidersHorizontal, LogOut, ExternalLink, Menu, X,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/landing', label: 'Landing Page', icon: LayoutPanelLeft },
  { href: '/admin/configs', label: 'Configs', icon: SlidersHorizontal },
];

export function AdminShell({ user, children }: { user: { email: string; name: string | null }; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        window.location.reload();
      }
    }
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:flex">
        <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <Link href="/admin" className="font-display text-xl font-extrabold">
            <span className="text-brand">SF</span> <span className="text-ink dark:text-white">Admin</span>
          </Link>
          <p className="mt-1 truncate text-xs text-ink-muted dark:text-gray-400">{user.email}</p>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                isActive(n.href, n.exact)
                  ? 'bg-brand text-white shadow-brand'
                  : 'text-ink hover:bg-brand-50 hover:text-brand-700 dark:text-gray-100 dark:hover:bg-gray-800 dark:hover:text-brand'
              )}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-100 p-4 dark:border-gray-800 space-y-1">
          <div className="flex items-center justify-between px-3 py-1.5 mb-1">
            <span className="text-xs font-medium text-ink-muted dark:text-gray-400">Theme</span>
            <ThemeToggle />
          </div>
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink hover:bg-brand-50 hover:text-brand-700 dark:text-gray-100 dark:hover:bg-gray-800 transition"
            target="_blank"
          >
            <ExternalLink className="h-4 w-4" /> View site
          </Link>
          <button
            onClick={() => logoutUser('/login')}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 lg:hidden">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg text-ink hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/admin" className="font-display text-lg font-extrabold">
              <span className="text-brand">SF</span> <span className="text-ink dark:text-white">Admin</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => logoutUser('/login')} className="flex h-9 items-center gap-1.5 rounded-full bg-red-50 px-3 text-xs font-semibold text-red-600 dark:bg-red-900/20" aria-label="Sign out">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
        <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true">
          {/* Backdrop placed behind the drawer panel */}
          <div
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer panel with z-10 on top of backdrop */}
          <div className="relative z-10 flex h-full w-[85vw] max-w-xs flex-col overflow-y-auto bg-white shadow-2xl dark:bg-gray-900 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <Link href="/admin" className="font-display text-lg font-extrabold">
                <span className="text-brand">SF</span> <span className="text-ink dark:text-white">Admin</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="px-5 pt-3 text-xs text-ink-muted dark:text-gray-400">{user.email}</p>
            <nav className="space-y-1 p-4">
              {NAV_ITEMS.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition',
                    isActive(n.href, n.exact)
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-ink hover:bg-brand-50 dark:text-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto space-y-1 border-t border-gray-100 p-4 dark:border-gray-800">
              <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-muted dark:text-gray-400" target="_blank">
                <ExternalLink className="h-4 w-4" /> View site
              </Link>
              <button onClick={() => logoutUser('/login')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
