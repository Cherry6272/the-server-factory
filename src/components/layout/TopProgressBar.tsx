'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // When route changes, complete the bar and hide it
  useEffect(() => {
    setProgress(100);
    const timer = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Intercept click on links to start the progress bar immediately (0ms response)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('a');
      if (!target || !target.href) return;

      // Ignore modifier keys, target="_blank", or download links
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        target.target === '_blank' ||
        target.hasAttribute('download') ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      try {
        const url = new URL(target.href);
        const currentUrl = new URL(window.location.href);

        // Same host, different path or search params
        if (
          url.origin === currentUrl.origin &&
          (url.pathname !== currentUrl.pathname || url.search !== currentUrl.search) &&
          !target.getAttribute('href')?.startsWith('#')
        ) {
          setLoading(true);
          setProgress(30);
          setTimeout(() => setProgress((p) => (p > 0 && p < 80 ? 70 : p)), 180);
          setTimeout(() => setProgress((p) => (p > 0 && p < 90 ? 88 : p)), 500);
        }
      } catch {
        // invalid URL, ignore
      }
    }

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed left-0 top-0 z-[9999] h-[3px] w-full pointer-events-none bg-transparent"
    >
      <div
        className="h-full bg-gradient-to-r from-brand via-[#72BF24] to-brand shadow-[0_0_10px_rgba(0,102,204,0.6)] transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? '200ms' : '300ms',
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}

