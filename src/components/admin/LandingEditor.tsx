'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { HeroSlidesEditor } from './HeroSlidesEditor';

type Block = {
  id: string;
  type: string;
  title: string | null;
  data: any;
  sortOrder: number;
  isVisible: boolean;
};

const BLOCK_TYPES = ['HERO_CAROUSEL', 'PROMO_BANNER', 'FEATURED_PRODUCTS', 'CATEGORY_GRID', 'TESTIMONIALS', 'BRAND_LOGOS', 'CTA', 'RICH_TEXT'];

export function LandingEditor({ blocks: initial }: { blocks: Block[] }) {
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(id: string, patch: Partial<Block>) {
    setLoading(id); setError(null);
    try {
      const res = await fetch(`/api/admin/landing/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Save failed');
      setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(null);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this block?')) return;
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/landing/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setBlocks(blocks.filter((b) => b.id !== id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(null);
    }
  }

  async function addBlock(type: string) {
    setLoading('new');
    try {
      const defaultData = getDefaultData(type);
      const res = await fetch('/api/admin/landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: type.replace(/_/g, ' '),
          data: defaultData,
          sortOrder: blocks.length,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Create failed');
      setBlocks([...blocks, data.block]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(null);
    }
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = blocks.findIndex((b) => b.id === id);
    const target = idx + dir;
    if (target < 0 || target >= blocks.length) return;
    const newOrder = [...blocks];
    [newOrder[idx], newOrder[target]] = [newOrder[target], newOrder[idx]];
    setBlocks(newOrder);
    await Promise.all(newOrder.map((b, i) =>
      fetch(`/api/admin/landing/${b.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: i }),
      })
    ));
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-4">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

      <div className="card p-5">
        <h3 className="mb-3 font-bold text-ink dark:text-white">Add Block</h3>
        <div className="flex flex-wrap gap-2">
          {BLOCK_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => addBlock(t)}
              disabled={loading === 'new'}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-brand hover:text-brand dark:border-navy-700 dark:bg-navy-950 dark:text-gray-200 dark:hover:border-brand"
            >
              <Plus className="h-3 w-3" /> {t.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {blocks.map((block, idx) => (
        <div key={block.id} className="card p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand">{block.type.replace(/_/g, ' ')}</span>
              <input
                defaultValue={block.title ?? ''}
                onBlur={(e) => save(block.id, { title: e.target.value })}
                className="mt-1 w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-lg font-bold hover:border-gray-200 focus:border-brand focus:bg-white dark:text-white dark:hover:border-navy-700 dark:focus:border-brand dark:focus:bg-navy-950"
                placeholder="Block title (admin-only label)"
              />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => move(block.id, -1)} disabled={idx === 0} className="rounded p-1.5 text-ink-muted hover:text-brand disabled:opacity-30 dark:text-gray-400" title="Move up">
                <ArrowUp className="h-4 w-4" />
              </button>
              <button onClick={() => move(block.id, 1)} disabled={idx === blocks.length - 1} className="rounded p-1.5 text-ink-muted hover:text-brand disabled:opacity-30 dark:text-gray-400" title="Move down">
                <ArrowDown className="h-4 w-4" />
              </button>
              <button onClick={() => save(block.id, { isVisible: !block.isVisible })} className={`rounded p-1.5 ${block.isVisible ? 'text-brand' : 'text-ink-muted dark:text-gray-500'}`} title={block.isVisible ? 'Hide' : 'Show'}>
                {block.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              <button onClick={() => remove(block.id)} className="rounded p-1.5 text-red-500 hover:text-red-600 dark:hover:bg-red-950/20" title="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <BlockEditor block={block} onSave={(data) => save(block.id, { data })} />
        </div>
      ))}
    </div>
  );
}

function BlockEditor({ block, onSave }: { block: Block; onSave: (data: any) => void }) {
  // Strip sectionBg from the JSON editor so it's managed by the color picker only
  const { sectionBg: _initialBg, ...restData } = (block.data ?? {}) as any;
  const [json, setJson] = useState(JSON.stringify(restData, null, 2));
  const [err, setErr] = useState<string | null>(null);
  const [sectionBg, setSectionBg] = useState<string>(_initialBg ?? '');

  function handleSave() {
    try {
      const parsed = JSON.parse(json);
      setErr(null);
      onSave(sectionBg ? { ...parsed, sectionBg } : parsed);
    } catch {
      setErr('Invalid JSON');
    }
  }

  // Hero carousels are the only blocks carrying images, so they get a real
  // editor with upload instead of hand-edited JSON.
  const isHero = block.type === 'HERO_CAROUSEL';

  return (
    <div>
      {/* Section background colour */}
      <div className="mb-4 flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 dark:border-navy-700/80 dark:bg-navy-950/70">
        <span className="text-xs font-semibold text-ink dark:text-gray-200">Section Background</span>
        <input
          type="color"
          value={sectionBg || '#ffffff'}
          onChange={(e) => setSectionBg(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-gray-200 dark:border-navy-700"
          title="Pick a background colour for this section"
        />
        {sectionBg ? (
          <>
            <span className="font-mono text-xs text-ink-muted dark:text-gray-300">{sectionBg}</span>
            <button
              type="button"
              onClick={() => setSectionBg('')}
              className="text-xs text-ink-muted hover:text-red-500 dark:text-gray-400"
            >
              Clear
            </button>
          </>
        ) : (
          <span className="text-xs text-ink-muted dark:text-gray-400">None (transparent)</span>
        )}
      </div>

      {isHero ? (
        <HeroSlidesEditor
          slides={Array.isArray(restData.slides) ? restData.slides : []}
          onSave={(slides) => onSave(sectionBg ? { ...restData, slides, sectionBg } : { ...restData, slides })}
        />
      ) : (
        <>
          <p className="mb-2 text-xs text-ink-muted dark:text-gray-400">
            Edit the data payload below. Refer to the README for schema of each block type.
          </p>
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            rows={8}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs outline-none focus:border-brand focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white dark:focus:border-brand dark:focus:bg-navy-900"
          />
          <div className="mt-2 flex items-center gap-3">
            <button onClick={handleSave} className="btn-brand text-sm">
              <Save className="h-3.5 w-3.5" /> Save
            </button>
            {err && <span className="text-sm text-red-600 dark:text-red-400">{err}</span>}
          </div>
        </>
      )}
    </div>
  );
}

function getDefaultData(type: string): any {
  switch (type) {
    case 'HERO_CAROUSEL':
      return { slides: [{ imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920', heading: 'Your heading', subheading: 'Subheading', ctaText: 'Shop now', ctaLink: '/' }] };
    case 'PROMO_BANNER':
      return { text: 'Sale announcement', link: '/', bgColor: '#71BC0A' };
    case 'FEATURED_PRODUCTS':
      return { heading: 'Featured Products', limit: 8 };
    case 'CATEGORY_GRID':
      return { heading: 'Shop by Category' };
    case 'BRAND_LOGOS':
      return { heading: 'Trusted by', brands: ['Dell', 'HP', 'Lenovo'] };
    case 'CTA':
      return { heading: 'CTA heading', subheading: 'Subheading', ctaText: 'Click here', ctaLink: '/' };
    case 'TESTIMONIALS':
      return { heading: 'What our customers say', items: [] };
    case 'RICH_TEXT':
      return { html: '<p>Rich text content</p>' };
    default:
      return {};
  }
}
