'use client';

import { Fragment, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronRight,
  ChevronDown,
  Home,
  Server,
  Cpu,
  HardDrive,
  Folder,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryNode } from '@/lib/categories';

export type Crumb = {
  label: string;
  /** null = current page, rendered as plain text / current highlight */
  href: string | null;
  /** sub-categories revealed in the hover/click flyout */
  children: CategoryNode[];
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  servers: Server,
  workstations: Cpu,
  components: HardDrive,
  rentals: Layers,
};

export function CategoryBreadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setOpenIdx(null);
  }, [pathname]);

  // Outside click & Escape key dismiss
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenIdx(null);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenIdx(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenIdx(null), 180);
  }

  function toggleIndex(idx: number) {
    setOpenIdx((prev) => (prev === idx ? null : idx));
  }

  const collapses = crumbs.length > 3;

  return (
    <nav
      ref={navRef}
      aria-label="Breadcrumb navigation"
      className="flex flex-wrap items-center gap-1.5 py-1 text-xs text-ink-muted dark:text-gray-400 sm:gap-2 sm:text-sm"
    >
      {crumbs.map((crumb, idx) => {
        const hasMenu = crumb.children && crumb.children.length > 0;
        const isOpen = openIdx === idx;
        const isFirst = idx === 0;
        const isLast = idx === crumbs.length - 1;
        const collapsed = collapses && idx > 0 && idx < crumbs.length - 2;

        return (
          <Fragment key={`${crumb.label}-${idx}`}>
            {idx > 0 && (
              <ChevronRight
                className={cn(
                  'h-3.5 w-3.5 flex-shrink-0 text-gray-300 dark:text-gray-600',
                  collapsed && 'hidden sm:block'
                )}
                aria-hidden="true"
              />
            )}

            <div
              className={cn('relative', collapsed && 'hidden sm:block')}
              onMouseEnter={() => {
                cancelClose();
                if (hasMenu) setOpenIdx(idx);
              }}
              onMouseLeave={scheduleClose}
            >
              {/* Catchy Pill Navigation Segment */}
              <div
                className={cn(
                  'group inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 transition-all shadow-2xs',
                  isLast
                    ? 'border-brand/40 bg-brand-50/70 text-brand font-bold dark:border-brand/40 dark:bg-brand/15 dark:text-brand-300'
                    : 'border-gray-200/90 bg-white/90 text-gray-700 hover:border-brand/60 hover:bg-brand-50/40 hover:text-brand dark:border-gray-800 dark:bg-navy-900/90 dark:text-gray-200 dark:hover:border-brand/40 dark:hover:bg-navy-800',
                  isOpen && 'border-brand ring-2 ring-brand/15 dark:border-brand'
                )}
              >
                {/* Home icon on first crumb */}
                {isFirst && (
                  <Home className="h-3.5 w-3.5 flex-shrink-0 text-brand" aria-hidden="true" />
                )}

                {/* Primary label / link */}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="truncate transition-colors hover:underline"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="truncate">{crumb.label}</span>
                )}

                {/* Catchy dropdown indicator button when sub-categories exist */}
                {hasMenu && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleIndex(idx);
                    }}
                    className={cn(
                      'ml-0.5 inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase transition-all',
                      isOpen
                        ? 'bg-brand text-white shadow-xs'
                        : 'bg-brand-50 text-brand group-hover:bg-brand group-hover:text-white dark:bg-brand/20 dark:text-brand-300 dark:group-hover:bg-brand dark:group-hover:text-white'
                    )}
                    aria-label={`Toggle ${crumb.label} sub-categories dropdown`}
                    aria-expanded={isOpen}
                  >
                    <ChevronDown
                      className={cn(
                        'h-3 w-3 transition-transform duration-200',
                        isOpen && 'rotate-180'
                      )}
                    />
                  </button>
                )}
              </div>

              {/* Flyout Dropdown Menu Panel (Works on both desktop hover and click/tap) */}
              {hasMenu && isOpen && (
                <div
                  className="absolute left-0 top-full z-50 mt-1.5"
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                >
                  <FlyoutPanel crumbName={crumb.label} nodes={crumb.children} />
                </div>
              )}
            </div>

            {/* Folded marker on small phone viewports */}
            {idx === 0 && collapses && (
              <span className="flex items-center gap-1 sm:hidden">
                <ChevronRight className="h-3 w-3 flex-shrink-0 text-gray-300 dark:text-gray-600" />
                <span className="select-none rounded bg-gray-100 px-1 py-0.5 text-xs text-gray-500 dark:bg-gray-800">
                  …
                </span>
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}

function FlyoutPanel({ crumbName, nodes }: { crumbName: string; nodes: CategoryNode[] }) {
  const [activeId, setActiveId] = useState<string | null>(nodes[0]?.id || null);
  const active = nodes.find((n) => n.id === activeId);

  return (
    <div className="flex w-auto max-w-[min(32rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white/98 shadow-2xl backdrop-blur-md dark:border-gray-800 dark:bg-navy-900/98 animate-in fade-in zoom-in-95">
      {/* Header ribbon */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-4 py-2.5 dark:border-gray-800 dark:bg-navy-950/70">
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-techgreen-600 dark:text-techgreen-400">
          <span className="h-1.5 w-1.5 rounded-full bg-techgreen-500 animate-pulse" />
          {crumbName === 'Home' ? 'All Hardware Categories' : `${crumbName} Fleet`}
        </span>
        <span className="text-[10px] text-ink-muted dark:text-gray-400">
          {nodes.length} categories
        </span>
      </div>

      <div className="flex">
        {/* Left column: direct children */}
        <div className="max-h-[60vh] w-52 flex-shrink-0 overflow-y-auto p-2 sm:w-60">
          {nodes.map((n) => {
            const Icon = CATEGORY_ICONS[n.slug] ?? Folder;
            const isSelected = activeId === n.id;
            const hasKids = n.children && n.children.length > 0;

            return (
              <Link
                key={n.id}
                href={`/category/${n.slug}`}
                onMouseEnter={() => setActiveId(n.id)}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:text-sm',
                  isSelected
                    ? 'bg-brand-50 text-brand shadow-xs dark:bg-brand/20 dark:text-brand-300'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-brand dark:text-gray-200 dark:hover:bg-gray-800/80 dark:hover:text-white'
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', isSelected ? 'text-brand' : 'text-gray-400')} />
                  <span className="truncate">{n.name}</span>
                </div>
                {hasKids && (
                  <ChevronRight
                    className={cn(
                      'h-3.5 w-3.5 flex-shrink-0 transition-transform',
                      isSelected ? 'translate-x-0.5 text-brand opacity-100' : 'opacity-40'
                    )}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right column: nested sub-categories if any */}
        {active && active.children && active.children.length > 0 && (
          <div className="max-h-[60vh] w-52 flex-shrink-0 overflow-y-auto border-l border-gray-100 p-2 dark:border-gray-800 sm:w-60">
            <div className="flex items-center justify-between px-3 pb-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-gray-400">
                {active.name}
              </span>
              <Link
                href={`/category/${active.slug}`}
                className="inline-flex items-center gap-0.5 text-[10px] font-bold text-brand hover:underline"
              >
                View all <ArrowRight className="h-2.5 w-2.5" />
              </Link>
            </div>
            <div className="space-y-0.5">
              {active.children.map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  className="block truncate rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-brand-50 hover:text-brand dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
