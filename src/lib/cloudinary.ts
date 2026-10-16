import { v2 as cloudinary } from 'cloudinary';

/**
 * Server-side Cloudinary. Used only for signing direct browser uploads and for
 * deleting files — image bytes never pass through this app.
 *
 * That matters on Vercel: serverless functions cap request bodies at 4.5 MB,
 * which most product photos exceed. Signing lets the browser POST straight to
 * Cloudinary with no size ceiling of ours, while keeping the API secret server-side.
 */
export const CLOUDINARY_FOLDERS = {
  products: 'serverfactory/products',
  landing: 'serverfactory/landing',
} as const;

export type CloudinaryFolder = (typeof CLOUDINARY_FOLDERS)[keyof typeof CLOUDINARY_FOLDERS];

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

function configured() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

/**
 * Signature for a direct browser upload. The signed params must match exactly
 * what the browser sends (minus file, api_key and resource_type) or Cloudinary
 * rejects it with "Invalid Signature".
 */
export function signUpload(folder: CloudinaryFolder) {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = configured().utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET as string
  );

  return {
    signature,
    timestamp,
    folder,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
  };
}

/** Deletes a file. Resolves to false when Cloudinary reports it wasn't found. */
export async function destroyImage(publicId: string): Promise<boolean> {
  const res = await configured().uploader.destroy(publicId, { invalidate: true });
  return res.result === 'ok';
}

/**
 * Walks arbitrary landing-block JSON and collects every `imagePublicId`.
 *
 * Landing block payloads are free-form JSON rather than typed rows, so rather
 * than hard-coding a shape per block type this just finds the key wherever it
 * appears — new block types get cleanup for free.
 */
export function collectPublicIds(value: unknown): string[] {
  const found: string[] = [];
  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if (k === 'imagePublicId' && typeof v === 'string' && v) found.push(v);
        else walk(v);
      }
    }
  };
  walk(value);
  return found;
}

/**
 * Rewrites a Cloudinary delivery URL to request a specific width with automatic
 * format and quality. Serving a correctly sized image straight from Cloudinary's
 * CDN keeps these off Vercel's Image Optimization quota.
 *
 * Non-Cloudinary URLs (seeded Unsplash links, hand-pasted ones) pass through
 * untouched.
 */
export function cloudinaryUrl(url: string | null | undefined, width: number): string {
  if (!url || typeof url !== 'string') return '';
  if (!url.includes('/upload/')) return url;
  if (!/res\.cloudinary\.com|\.cloudinary\.com/.test(url)) return url;
  // Don't stack transformations if one is already present
  if (/\/upload\/[^/]*[fqwc]_/.test(url)) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${width}/`);
}
