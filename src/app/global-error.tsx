'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Root layout client exception:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#061527] p-4 text-center font-sans text-white">
        <div className="max-w-md rounded-2xl border border-red-500/30 bg-navy-900/80 p-8 shadow-2xl backdrop-blur">
          <h2 className="text-2xl font-bold text-red-400">Application Error</h2>
          <p className="mt-2 text-sm text-gray-300">
            A critical client exception occurred.
          </p>
          {error?.message && (
            <p className="mt-3 rounded bg-black/40 p-3 font-mono text-xs text-red-300 break-words text-left">
              {error.message}
            </p>
          )}
          <button
            onClick={() => reset()}
            className="mt-6 rounded-full bg-[#0066CC] px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-[#0052A3]"
          >
            Reload application
          </button>
        </div>
      </body>
    </html>
  );
}

