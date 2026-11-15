'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type UploadedImage = { url: string; publicId: string };

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/**
 * Uploads straight from the browser to Cloudinary using a signature minted by
 * /api/admin/upload. The file never touches our server, so Vercel's 4.5 MB
 * serverless body limit doesn't apply.
 */
export function ImageUploader({
  folder,
  onUploaded,
  multiple = false,
  label = 'Upload image',
  className,
}: {
  folder: 'products' | 'landing';
  onUploaded: (images: UploadedImage[]) => void;
  multiple?: boolean;
  label?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function uploadOne(file: File, sign: SignResponse): Promise<UploadedImage> {
    const body = new FormData();
    body.append('file', file);
    body.append('api_key', sign.apiKey);
    body.append('timestamp', String(sign.timestamp));
    body.append('folder', sign.folder);
    body.append('signature', sign.signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, {
      method: 'POST',
      body,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message ?? 'Cloudinary rejected the upload');
    return { url: data.secure_url as string, publicId: data.public_id as string };
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);

    for (const f of list) {
      if (!ACCEPTED.includes(f.type)) {
        setError(`${f.name}: unsupported format. Use JPG, PNG, WebP or AVIF.`);
        return;
      }
      if (f.size > MAX_BYTES) {
        setError(`${f.name}: ${(f.size / 1024 / 1024).toFixed(1)} MB exceeds the 10 MB limit.`);
        return;
      }
    }

    setBusy(true);
    setError(null);
    try {
      // One signature per batch — it stays valid for the whole run.
      const signRes = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder }),
      });
      const sign: SignResponse & { error?: string } = await signRes.json();
      if (!signRes.ok) throw new Error(sign.error ?? 'Could not start upload');

      const done: UploadedImage[] = [];
      for (const [i, file] of list.entries()) {
        setProgress(list.length > 1 ? `Uploading ${i + 1} of ${list.length}...` : 'Uploading...');
        done.push(await uploadOne(file, sign));
      }
      onUploaded(done);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = ''; // allow re-picking the same file
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        /*
         * Visually hidden, but still rendered. `display: none` (Tailwind's
         * `hidden`) looks equivalent and is not: Safari silently ignores a
         * programmatic .click() on a file input that isn't in the render tree,
         * so the picker never opens and nothing at all happens.
         *
         * Hidden from assistive tech too — the button beside it is the real,
         * labelled control, so this would only be a duplicate tab stop.
         */
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold transition',
          busy ? 'opacity-60' : 'hover:border-brand hover:text-brand',
          'dark:border-navy-700 dark:bg-navy-900 dark:text-gray-200'
        )}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {progress ?? label}
      </button>
      <p className="mt-1.5 text-xs text-ink-muted dark:text-gray-400">
        JPG, PNG, WebP or AVIF · up to 10 MB{multiple ? ' · multiple allowed' : ''}
      </p>
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

type SignResponse = {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
};
