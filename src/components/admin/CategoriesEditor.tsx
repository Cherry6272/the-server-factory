'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Save, Trash2, ChevronRight, ChevronDown, FolderTree, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type CatNode = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  isVisible: boolean;
  productCount: number;
  children: CatNode[];
};

const SOFT_DEPTH_WARN = 3; // warn beyond Category → Sub → Sub-sub

export function CategoriesEditor({ initialTree }: { initialTree: CatNode[] }) {
  const router = useRouter();
  const [tree, setTree] = useState<CatNode[]>(initialTree);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNewRoot, setShowNewRoot] = useState(false);

  function refresh() {
    router.refresh();
  }

  async function saveField(id: string, patch: Partial<CatNode>) {
    setLoadingId(id); setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Save failed');
      // Mutate in place
      function apply(nodes: CatNode[]): CatNode[] {
        return nodes.map((n) => n.id === id ? { ...n, ...patch } : { ...n, children: apply(n.children) });
      }
      setTree(apply(tree));
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoadingId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this category? Its children (if any) will become orphaned. Move or delete them first if needed.')) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Delete failed');
      function remove(nodes: CatNode[]): CatNode[] {
        return nodes.filter((n) => n.id !== id).map((n) => ({ ...n, children: remove(n.children) }));
      }
      setTree(remove(tree));
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoadingId(null);
    }
  }

  async function createChild(parentId: string | null, data: { name: string; slug: string; description?: string }) {
    setLoadingId(parentId ?? 'root');
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, parentId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Create failed');
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      throw err;
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="mt-6 space-y-4 md:mt-8">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-ink-muted dark:text-gray-400">
          <FolderTree className="h-4 w-4" /> {tree.length} top-level categor{tree.length === 1 ? 'y' : 'ies'}
        </div>
        <button onClick={() => setShowNewRoot(true)} className="btn-brand text-sm">
          <Plus className="h-4 w-4" /> New Top-level
        </button>
      </div>

      {showNewRoot && (
        <NewCategoryForm
          parentId={null}
          depth={0}
          onCancel={() => setShowNewRoot(false)}
          onCreate={async (data) => {
            await createChild(null, data);
            setShowNewRoot(false);
          }}
        />
      )}

      <div className="card p-2 md:p-4">
        {tree.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-muted dark:text-gray-400">
            No categories yet. Click &ldquo;New Top-level&rdquo; to create the first one (e.g. Servers, Workstations).
          </p>
        ) : (
          tree.map((node) => (
            <CategoryRow
              key={node.id}
              node={node}
              depth={0}
              loadingId={loadingId}
              onSave={saveField}
              onDelete={remove}
              onCreateChild={createChild}
            />
          ))
        )}
      </div>

      <p className="text-xs text-ink-muted dark:text-gray-400">
        💡 Tip: The mega menu shows the first 3 levels (Category → Sub → Sub-sub). You can nest deeper for organisation,
        but deeper levels only surface on the category landing pages.
      </p>
    </div>
  );
}

function CategoryRow({
  node, depth, loadingId, onSave, onDelete, onCreateChild,
}: {
  node: CatNode;
  depth: number;
  loadingId: string | null;
  onSave: (id: string, p: Partial<CatNode>) => void;
  onDelete: (id: string) => void;
  onCreateChild: (parentId: string | null, data: { name: string; slug: string; description?: string }) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(depth < 2); // Roots and one level open by default
  const [name, setName] = useState(node.name);
  const [slug, setSlug] = useState(node.slug);
  const [adding, setAdding] = useState(false);
  const hasChildren = node.children.length > 0;
  const dirty = name !== node.name || slug !== node.slug;

  const depthWarning = depth >= SOFT_DEPTH_WARN;

  return (
    <div className={cn(depth === 0 ? 'border-t border-gray-100 first:border-t-0 dark:border-gray-800' : '')}>
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 px-2 py-2 md:gap-3 md:py-3',
          depth === 0 ? 'bg-transparent' : 'border-l-2 border-gray-100 dark:border-gray-800'
        )}
        style={{ paddingLeft: `${8 + depth * 20}px` }}
      >
        <button
          onClick={() => setExpanded((v) => !v)}
          disabled={!hasChildren}
          className={cn(
            'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800',
            !hasChildren && 'opacity-20'
          )}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={cn(
            'min-w-[120px] flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm hover:border-gray-200 focus:border-brand focus:bg-white dark:hover:border-navy-700 dark:focus:bg-navy-900 dark:text-gray-100',
            depth === 0 ? 'font-semibold' : 'font-normal'
          )}
          placeholder="Category name"
        />
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="hidden w-32 rounded-lg border border-transparent bg-transparent px-2 py-1 font-mono text-xs text-ink-muted hover:border-gray-200 focus:border-brand focus:bg-white dark:text-gray-400 dark:hover:border-navy-700 dark:focus:bg-navy-900 md:block"
          placeholder="slug"
        />
        <span className="text-xs text-ink-muted dark:text-gray-400 whitespace-nowrap">
          {node.productCount} products
        </span>

        <button
          onClick={() => onSave(node.id, { isVisible: !node.isVisible })}
          className={cn('rounded p-1.5 transition', node.isVisible ? 'text-brand' : 'text-ink-muted')}
          title={node.isVisible ? 'Visible' : 'Hidden'}
        >
          {node.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>

        {dirty && (
          <button
            onClick={() => onSave(node.id, { name, slug })}
            disabled={loadingId === node.id}
            className="rounded p-1.5 text-brand hover:bg-brand-50 dark:hover:bg-gray-800"
            title="Save"
          >
            <Save className="h-4 w-4" />
          </button>
        )}

        <button
          onClick={() => setAdding(true)}
          className="rounded p-1.5 text-ink-muted hover:bg-brand-50 hover:text-brand dark:hover:bg-gray-800"
          title="Add child category"
        >
          <Plus className="h-4 w-4" />
        </button>

        <button
          onClick={() => onDelete(node.id)}
          disabled={loadingId === node.id}
          className="rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {adding && (
        <div style={{ paddingLeft: `${40 + depth * 20}px`, paddingRight: '8px', paddingBottom: '12px' }}>
          {depthWarning && (
            <p className="mb-2 rounded-md bg-amber-50 px-3 py-1.5 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              ⚠️ Depth {depth + 1}: the mega menu only shows the first 3 levels. Children beyond that are reachable only via category pages.
            </p>
          )}
          <NewCategoryForm
            parentId={node.id}
            depth={depth + 1}
            onCancel={() => setAdding(false)}
            onCreate={async (data) => {
              await onCreateChild(node.id, data);
              setAdding(false);
            }}
          />
        </div>
      )}

      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <CategoryRow
              key={child.id}
              node={child}
              depth={depth + 1}
              loadingId={loadingId}
              onSave={onSave}
              onDelete={onDelete}
              onCreateChild={onCreateChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NewCategoryForm({
  parentId, depth, onCreate, onCancel,
}: {
  parentId: string | null;
  depth: number;
  onCreate: (data: { name: string; slug: string; description?: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onCreate({ name: name.trim(), slug: (slug || slugify(name)).trim() });
      setName(''); setSlug('');
    } catch { /* error shown by parent */ } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-navy-700 dark:bg-navy-900/60">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-gray-400">
        {parentId ? `New sub-category (level ${depth + 1})` : 'New top-level category'}
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          autoFocus
          placeholder="Name"
          value={name}
          onChange={(e) => { setName(e.target.value); if (!slug) setSlug(slugify(e.target.value)); }}
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand dark:border-navy-700 dark:bg-navy-950/60 dark:text-gray-100 dark:focus:bg-navy-900"
        />
        <input
          placeholder="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-32 rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-xs focus:border-brand dark:border-navy-700 dark:bg-navy-950/60 dark:text-gray-100 dark:focus:bg-navy-900"
        />
        <button onClick={submit} disabled={loading || !name.trim()} className="btn-brand text-sm">
          {loading ? 'Saving...' : 'Create'}
        </button>
        <button onClick={onCancel} className="rounded-full border border-gray-200 px-4 py-2 text-sm dark:border-navy-700 dark:text-gray-300 dark:hover:bg-navy-800">
          Cancel
        </button>
      </div>
    </div>
  );
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
}
