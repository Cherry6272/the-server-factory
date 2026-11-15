'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled client exception:', error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md rounded-2xl border border-red-200 bg-red-50/50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
        <h2 className="font-display text-xl font-bold text-red-600 dark:text-red-400">
          Application Error
        </h2>
        <p className="mt-2 text-sm text-ink-muted dark:text-gray-300">
          An unexpected client error occurred while loading this page.
        </p>
        {error?.message && (
          <p className="mt-3 rounded bg-black/5 p-2 font-mono text-xs text-red-700 dark:bg-white/5 dark:text-red-300 break-words text-left">
            {error.message}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-ink transition hover:bg-gray-100 dark:border-navy-700 dark:text-gray-200 dark:hover:bg-navy-800"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

