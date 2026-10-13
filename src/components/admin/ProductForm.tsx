'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Trash2 } from 'lucide-react';
import { ProductImageManager, type ProductImageInput } from './ProductImageManager';

type Category = { id: string; name: string };
type ProductData = {
  id?: string;
  sku: string;
  name: string;
  slug: string;
  brand: string;
  shortDesc: string;
  description: string;
  basePrice: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
  metaTitle: string;
  metaDescription: string;
  images: ProductImageInput[];
};

export function ProductForm({ categories, product }: { categories: Category[]; product?: ProductData }) {
  const router = useRouter();
  const isEdit = !!product?.id;
  const [form, setForm] = useState<ProductData>(product ?? {
    sku: '', name: '', slug: '', brand: '', shortDesc: '', description: '',
    basePrice: 0, stock: 0, isActive: true, isFeatured: false,
    categoryId: categories[0]?.id ?? '', metaTitle: '', metaDescription: '', images: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const url = isEdit ? `/api/admin/products/${form.id}` : '/api/admin/products';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      if (!isEdit) router.push(`/admin/products/${data.product.id}`);
      else router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!form.id || !confirm('Delete this product permanently?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${form.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      router.push('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="card p-6">
        <h2 className="mb-4 font-display font-bold">Basic Info</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v, slug: isEdit ? form.slug : slugify(v) })} required />
          <Field label="SKU" value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} required />
          <Field label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} required />
          <Field label="Brand" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} />
          <div>
            <label className="text-sm font-medium">Category *</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none focus:border-brand focus:bg-white"
              required
            >
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Field label="Base Price (₹)" type="number" value={String(form.basePrice)} onChange={(v) => setForm({ ...form, basePrice: Number(v) })} required />
          <Field label="Stock" type="number" value={String(form.stock)} onChange={(v) => setForm({ ...form, stock: Number(v) })} />
        </div>
        <div className="mt-4">
          <Field label="Short Description" value={form.shortDesc} onChange={(v) => setForm({ ...form, shortDesc: v })} />
        </div>
        <div className="mt-4">
          <label className="text-sm font-medium">Long Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={5}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none focus:border-brand focus:bg-white"
          />
        </div>
        <div className="mt-4 flex gap-6">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded text-brand" />
            <span className="text-sm">Active</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="rounded text-brand" />
            <span className="text-sm">Featured on homepage</span>
          </label>
        </div>
      </div>

      <div className="card p-6">
        <ProductImageManager
          images={form.images}
          onChange={(images) => setForm({ ...form, images })}
          defaultAlt={form.name}
        />
      </div>

      <div className="card p-6">
        <h2 className="mb-4 font-display font-bold">SEO</h2>
        <Field label="Meta Title" value={form.metaTitle} onChange={(v) => setForm({ ...form, metaTitle: v })} />
        <div className="mt-4">
          <label className="text-sm font-medium">Meta Description</label>
          <textarea
            value={form.metaDescription}
            onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none focus:border-brand focus:bg-white"
          />
          <p className="mt-1 text-xs text-ink-muted">Recommended: 150-160 characters for best SEO.</p>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-brand">
          <Save className="h-4 w-4" /> {loading ? 'Saving...' : 'Save'}
        </button>
        {isEdit && (
          <button type="button" onClick={handleDelete} disabled={loading} className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-6 py-3 font-semibold text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        )}
      </div>
    </form>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}{required && <span className="text-brand"> *</span>}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none focus:border-brand focus:bg-white"
      />
    </div>
  );
}

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
}
