'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, ArrowRight } from 'lucide-react';

interface CategorySearchBarProps {
  categoryName: string;
  currentSlug: string;
}

export function CategorySearchBar({ categoryName, currentSlug }: { categoryName: string; currentSlug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeQ = searchParams.get('q') || '';
  const [query, setQuery] = useState(activeQ);

  // Sync internal input state if search param changes externally
  useEffect(() => {
    setQuery(activeQ);
  }, [activeQ]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(searchParams.toString());
    const trimmed = query.trim();
    if (trimmed) {
      next.set('q', trimmed);
    } else {
      next.delete('q');
    }
    router.push(`/category/${currentSlug}?${next.toString()}`);
  }

  function handleClear() {
    setQuery('');
    const next = new URLSearchParams(searchParams.toString());
    next.delete('q');
    router.push(`/category/${currentSlug}?${next.toString()}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="group relative flex w-full items-center rounded-2xl border border-gray-200/90 bg-white px-3.5 py-2 shadow-xs transition-all duration-200 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15 hover:border-brand/50 dark:border-gray-800 dark:bg-navy-900/90 dark:focus-within:border-brand sm:px-4 sm:py-2.5"
      role="search"
    >
      <Search className="h-4.5 w-4.5 flex-shrink-0 text-brand transition-transform group-focus-within:scale-110" aria-hidden="true" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search in ${categoryName} (e.g. Dell PowerEdge, Xeon, RTX 4090, 64GB)...`}
        className="w-full min-w-0 bg-transparent px-2.5 text-xs font-medium text-ink outline-none placeholder:text-gray-400 dark:text-gray-100 sm:text-sm"
        aria-label={`Search hardware in ${categoryName}`}
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="mr-1.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-ink dark:hover:bg-gray-800 dark:hover:text-gray-200"
          title="Clear search"
          aria-label="Clear search input"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        type="submit"
        className="flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-brand-600 hover:shadow-brand/25 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand sm:text-sm"
        aria-label="Submit search"
      >
        <span>Search</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
