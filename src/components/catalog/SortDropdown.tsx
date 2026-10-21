'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  SlidersHorizontal,
  ChevronDown,
  Check,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowDownAZ,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First', icon: Clock },
  { value: 'price-asc', label: 'Price: Low to High', icon: TrendingUp },
  { value: 'price-desc', label: 'Price: High to Low', icon: TrendingDown },
  { value: 'name', label: 'Name: A to Z', icon: ArrowDownAZ },
] as const;

export function SortDropdown({
  currentSlug,
  currentSort,
}: {
  currentSlug: string;
  currentSort: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    SORT_OPTIONS.find((opt) => opt.value === currentSort) || SORT_OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  function handleSelect(value: string) {
    setIsOpen(false);
    const next = new URLSearchParams(searchParams.toString());
    next.set('sort', value);
    router.push(`/category/${currentSlug}?${next.toString()}`);
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'group inline-flex items-center gap-2 rounded-xl border border-gray-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-ink shadow-xs transition-all hover:border-brand/50 hover:shadow-soft dark:border-gray-800 dark:bg-navy-900 dark:text-gray-200 dark:hover:border-brand/40 sm:text-sm',
          isOpen && 'border-brand ring-2 ring-brand/10 dark:border-brand'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <SlidersHorizontal className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
        <span className="text-xs font-medium text-ink-muted dark:text-gray-400">Sort by:</span>
        <span className="font-bold text-navy-900 dark:text-white">{selectedOption.label}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-ink-muted transition-transform duration-200 dark:text-gray-400',
            isOpen && 'rotate-180 text-brand'
          )}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full z-40 mt-1.5 w-56 overflow-hidden rounded-2xl border border-gray-100 bg-white/95 p-1.5 shadow-xl backdrop-blur-md dark:border-gray-800 dark:bg-navy-900/95"
          role="listbox"
          tabIndex={-1}
        >
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-gray-400">
            Order Catalog By
          </div>
          <div className="space-y-0.5">
            {SORT_OPTIONS.map((opt) => {
              const isSelected = opt.value === selectedOption.value;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors sm:text-sm',
                    isSelected
                      ? 'bg-brand-50 font-bold text-brand dark:bg-brand/20 dark:text-brand-300'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-brand dark:text-gray-200 dark:hover:bg-gray-800/80 dark:hover:text-white'
                  )}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        isSelected ? 'text-brand dark:text-brand-300' : 'text-gray-400'
                      )}
                    />
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {isSelected && <Check className="h-4 w-4 flex-shrink-0 text-brand dark:text-brand-300" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
