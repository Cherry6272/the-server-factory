'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  ChevronDown, Search, User, Menu, X, Server,
  LogOut, LayoutDashboard, Package, UserCircle,
} from 'lucide-react';
import { CartIcon } from '@/components/cart/CartIcon';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/utils';
import type { CategoryNode } from '@/lib/categories';

type UserInfo = { name: string | null; email: string; role: 'USER' | 'ADMIN' } | null;

/** Static company pages that sit alongside the category roots in the nav */
const PAGE_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function NavbarClient({ roots, user }: { roots: CategoryNode[]; user: UserInfo }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<Set<string>>(new Set());
  const pathname = usePathname();
  const userRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close all popovers on navigation
  useEffect(() => {
    setOpenId(null);
    setMobileOpen(false);
    setUserOpen(false);
  }, [pathname]);

  // Close user dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Body scroll lock when mobile drawer open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Escape closes dropdown
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpenId(null); setUserOpen(false); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Delayed close — gives the mouse time to travel from trigger to dropdown
  function cancelClose() {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  }
  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenId(null), 150);
  }

  function toggleMobileExpand(id: string) {
    setMobileExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-4 lg:px-8 2xl:max-w-[1600px] 3xl:max-w-[1760px]">

          {/* Logo + hamburger — never shrinks, so the wordmark is never clipped */}
          <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-navy-900 text-white shadow-sm shadow-brand/20 group-hover:scale-105 transition-transform">
                <Server className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-display text-xl sm:text-2xl font-extrabold tracking-tight">
                  <span className="text-brand">SERVER</span>
                  <span className="text-navy-900 dark:text-white">FACTORY</span>
                </span>
                <span className="text-[8px] xs:text-[9px] font-bold tracking-[0.16em] text-techgreen-600 dark:text-techgreen-400 uppercase -mt-0.5">
                  A BYTECHIP TECHNOLOGIES VENTURE
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop nav — the flexible element, so any shortfall comes out of here
              rather than squeezing the wordmark. Can't use overflow-x here: it would
              clip the hover dropdowns, which hang below the bar. */}
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex">
            {roots.map((root) => {
              const hasChildren = root.children.length > 0;
              const isOpen = openId === root.id;
              return (
                <div
                  key={root.id}
                  className="relative min-w-0"
                  onMouseEnter={() => { cancelClose(); if (hasChildren) setOpenId(root.id); }}
                  onMouseLeave={scheduleClose}
                >
                  <Link
                    href={`/category/${root.slug}`}
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2.5 py-2 text-sm font-medium transition-colors xl:px-4',
                      isOpen
                        ? 'bg-brand-50 text-brand-700 dark:bg-gray-800 dark:text-brand'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800'
                    )}
                  >
                    {/* Safety net for unusually many or long categories: labels ellipsize
                        before anything is allowed to push on the wordmark. Truncating here
                        (not on the wrapper) keeps the dropdown out of the clipping context. */}
                    <span className="truncate">{root.name}</span>
                    {hasChildren && (
                      <ChevronDown className={cn('h-3.5 w-3.5 flex-shrink-0 transition-transform', isOpen && 'rotate-180')} />
                    )}
                  </Link>

                  {/* Dropdown */}
                  {hasChildren && isOpen && (
                    <div
                      className="absolute left-0 top-full z-50"
                      onMouseEnter={cancelClose}
                      onMouseLeave={scheduleClose}
                    >
                      {/* Invisible bridge so mouse can travel from trigger to panel without hover loss */}
                      <div className="h-2" />
                      <DropdownPanel root={root} />
                    </div>
                  )}
                </div>
              );
            })}

            {PAGE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-medium transition-colors xl:px-4',
                  pathname === link.href
                    ? 'bg-brand-50 text-brand-700 dark:bg-gray-800 dark:text-brand'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
            {/* Full search field only from 2xl. Below that it costs ~210px the category
                links need, and its absence just means one extra tap on the icon. */}
            <form action="/search" className="relative hidden 2xl:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" />
              <input
                name="q"
                placeholder="Search servers, workstations..."
                className="w-52 rounded-full border-2 border-brand/30 py-2.5 pl-9 pr-4 text-sm font-medium outline-none transition-all placeholder:text-gray-400 focus:w-72 focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-gray-600 dark:bg-gray-900 dark:focus:border-brand 3xl:w-64 3xl:focus:w-80"
              />
            </form>
            {/* Below xs the drawer carries the search entry so the wordmark isn't squeezed */}
            <Link href="/search" className="hidden h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 xs:flex 2xl:hidden" aria-label="Search">
              <Search className="h-4 w-4" />
            </Link>

            {/* Below xs the header can't fit this too — the drawer carries a Theme row instead */}
            <span className="hidden xs:block">
              <ThemeToggle />
            </span>
            <CartIcon />

            {user ? (
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setUserOpen((v) => !v)}
                  className="flex h-9 w-9 items-center justify-center gap-1.5 rounded-full bg-brand-50 text-sm font-semibold text-brand-700 transition hover:bg-brand hover:text-white dark:bg-gray-800 dark:text-gray-100 xs:w-auto xs:px-3"
                  aria-label="Account menu"
                >
                  <User className="h-4 w-4 flex-shrink-0" />
                  {/* A long first name must not push the wordmark — cap and ellipsize it */}
                  <span className="hidden max-w-[7rem] truncate sm:inline">{user.name?.split(' ')[0] ?? 'Account'}</span>
                  <ChevronDown className="hidden h-3 w-3 flex-shrink-0 xs:block" />
                </button>

                {userOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
                    <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                      <p className="text-sm font-semibold">{user.name ?? 'Account'}</p>
                      <p className="truncate text-xs text-gray-500">{user.email}</p>
                    </div>
                    <div className="p-1.5">
                      {user.role === 'ADMIN' && (
                        <Link href="/admin" onClick={() => setUserOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                          <LayoutDashboard className="h-4 w-4 text-brand" /> Admin Dashboard
                        </Link>
                      )}
                      <Link href="/account" onClick={() => setUserOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                        <UserCircle className="h-4 w-4 text-brand" /> My Profile
                      </Link>
                      <Link href="/account/orders" onClick={() => setUserOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                        <Package className="h-4 w-4 text-brand" /> Orders
                      </Link>
                    </div>
                    <div className="border-t border-gray-100 p-1.5 dark:border-gray-800">
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white transition hover:bg-brand-600 xs:w-auto xs:px-4"
                aria-label="Sign in"
              >
                <User className="h-4 w-4 xs:hidden" />
                <span className="hidden xs:inline">Sign in</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-navy-900 text-white">
                  <Server className="h-4 w-4" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-display text-lg font-extrabold">
                    <span className="text-brand">SERVER</span>
                    <span className="text-navy-900 dark:text-white">FACTORY</span>
                  </span>
                  <span className="text-[8px] font-bold tracking-[0.14em] text-techgreen-600 dark:text-techgreen-400 uppercase">
                    BYTECHIP TECHNOLOGIES
                  </span>
                </div>
              </Link>
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <form action="/search" className="relative px-3 pt-3 xs:hidden">
                <Search className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" />
                <input
                  name="q"
                  placeholder="Search hardware..."
                  className="w-full rounded-full border border-gray-200 py-2.5 pl-9 pr-3 text-base outline-none focus:border-brand dark:border-gray-700 dark:bg-gray-800"
                />
              </form>
              <nav className="p-3">
                {roots.map((root) => (
                  <MobileNode
                    key={root.id}
                    node={root}
                    depth={0}
                    expanded={mobileExpanded}
                    onToggle={toggleMobileExpand}
                    onNavigate={() => setMobileOpen(false)}
                  />
                ))}

                <div className="my-2 border-t border-gray-100 dark:border-gray-800" />
                {PAGE_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="border-t border-gray-100 p-4 dark:border-gray-800">
              <div className="mb-2 flex items-center justify-between px-3 xs:hidden">
                <span className="text-sm text-gray-500">Theme</span>
                <ThemeToggle />
              </div>
              {user ? (
                <div className="space-y-1">
                  <p className="px-3 text-xs text-gray-500">{user.email}</p>
                  {user.role === 'ADMIN' && (
                    <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                      <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
                    </Link>
                  )}
                  <Link href="/account" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                    <UserCircle className="h-4 w-4" /> My Profile
                  </Link>
                  <Link href="/account/orders" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                    <Package className="h-4 w-4" /> Orders
                  </Link>
                  <button onClick={() => { setMobileOpen(false); signOut({ callbackUrl: '/' }); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              ) : (
                <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-brand w-full">Sign in</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Simple dropdown: sub-categories as bold links, sub-sub-categories indented beneath each */
function DropdownPanel({ root }: { root: CategoryNode }) {
  return (
    <div className="min-w-[240px] max-w-[320px] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-100 px-4 py-2.5 dark:border-gray-800">
        <Link
          href={`/category/${root.slug}`}
          className="text-xs font-semibold uppercase tracking-wider text-brand hover:underline"
        >
          All {root.name} →
        </Link>
      </div>

      <div className="max-h-[70vh] overflow-y-auto p-2">
        {root.children.map((sub) => (
          <div key={sub.id} className="mb-1">
            <Link
              href={`/category/${sub.slug}`}
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-brand-50 hover:text-brand dark:text-gray-100 dark:hover:bg-gray-800"
            >
              {sub.name}
            </Link>
            {sub.children.length > 0 && (
              <div className="ml-3 mt-0.5 border-l border-gray-100 pl-3 dark:border-gray-700">
                {sub.children.map((subsub) => (
                  <Link
                    key={subsub.id}
                    href={`/category/${subsub.slug}`}
                    className="block rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-brand-50 hover:text-brand dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    {subsub.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Recursive mobile accordion */
function MobileNode({
  node, depth, expanded, onToggle, onNavigate,
}: {
  node: CategoryNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onNavigate: () => void;
}) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const indentStyle = depth > 0 ? { paddingLeft: `${depth * 12}px` } : {};

  return (
    <div>
      <div className="flex items-center" style={indentStyle}>
        <Link
          href={`/category/${node.slug}`}
          onClick={onNavigate}
          className={cn(
            'flex-1 rounded-lg px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800',
            depth === 0 ? 'font-semibold' : 'text-gray-600 dark:text-gray-400'
          )}
        >
          {node.name}
        </Link>
        {hasChildren && (
          <button
            onClick={() => onToggle(node.id)}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={isOpen ? 'Collapse' : 'Expand'}
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
          </button>
        )}
      </div>

      {isOpen && hasChildren && (
        <div>
          {node.children.map((child) => (
            <MobileNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
