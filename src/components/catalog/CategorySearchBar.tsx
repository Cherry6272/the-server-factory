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
      className="relative flex w-full items-center rounded-xl border border-gray-200/90 bg-white px-2.5 py-1.5 shadow-xs transition-all focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 hover:border-brand/40 dark:border-gray-800 dark:bg-navy-900/90 sm:w-72 md:w-80 lg:w-84 xl:w-96"
      role="search"
    >
      <Search className="h-4 w-4 flex-shrink-0 text-brand" aria-hidden="true" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search in ${categoryName}...`}
        className="w-full min-w-0 bg-transparent px-2 text-xs font-medium text-ink outline-none placeholder:text-gray-400 dark:text-gray-100 sm:text-sm"
        aria-label={`Search hardware in ${categoryName}`}
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="mr-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-ink dark:hover:bg-gray-800 dark:hover:text-gray-200"
          title="Clear search"
          aria-label="Clear search input"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        type="submit"
        className="flex flex-shrink-0 items-center gap-1 rounded-lg bg-brand px-2.5 py-1 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-brand-600 focus:outline-none focus:ring-1 focus:ring-brand"
        aria-label="Submit search"
      >
        <span className="hidden xs:inline">Search</span>
        <ArrowRight className="h-3 w-3" />
      </button>
    </form>
  );
}
