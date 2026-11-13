import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, Search, SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '../components/ProductCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { api, getErrorMessage } from '../utils/api.js';
import { CATEGORY_ORDER } from '../utils/format.js';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name (A–Z)' },
];

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="skeleton aspect-[4/3] rounded-none" />
          <div className="space-y-3 p-5">
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-4 w-4/5" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-8 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || 'all';
  const sort = params.get('sort') || 'newest';
  const urlSearch = params.get('q') || '';

  const [search, setSearch] = useState(urlSearch);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Keep the search box in sync with the URL (e.g. when using browser back).
  useEffect(() => setSearch(urlSearch), [urlSearch]);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  // Update the URL after a short pause while typing.
  useEffect(() => {
    if (search.trim() === urlSearch) return undefined;
    const timer = setTimeout(() => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        if (search.trim()) next.set('q', search.trim()); else next.delete('q');
        return next;
      }, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, urlSearch, setParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api.get('/products', { params: { category, sort, search: urlSearch || undefined } })
      .then((r) => { if (!cancelled) setProducts(r.data); })
      .catch((e) => { if (!cancelled) setError(getErrorMessage(e, 'Could not load products.')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [category, sort, urlSearch]);

  const orderedCategories = useMemo(
    () => [...categories].sort((a, b) => CATEGORY_ORDER.indexOf(a.slug) - CATEGORY_ORDER.indexOf(b.slug)),
    [categories]
  );
  const activeCategory = categories.find((c) => c.slug === category);

  const update = (key, value) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!value || value === 'all' || (key === 'sort' && value === 'newest')) next.delete(key);
      else next.set(key, value);
      return next;
    });
  };

  const clearFilters = () => {
    setSearch('');
    setParams({});
  };

  const hasFilters = category !== 'all' || sort !== 'newest' || urlSearch;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold text-tt-600">Store</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          {activeCategory ? activeCategory.name : 'All products'}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {loading ? 'Loading products…' : `${products.length} product${products.length === 1 ? '' : 's'} found`}
        </p>
      </div>

      {/* Toolbar: search, sort */}
      <div className="card mb-6 flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search phones, routers, packages…"
            className="input pl-10"
            aria-label="Search products"
            maxLength={100}
          />
        </div>
        <div className="flex items-center gap-2 sm:w-64">
          <SlidersHorizontal className="size-4 shrink-0 text-slate-500" aria-hidden />
          <label htmlFor="sort" className="sr-only">Sort by</label>
          <select id="sort" className="input" value={sort} onChange={(e) => update('sort', e.target.value)}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Category chips (scroll horizontally on small screens) */}
      <div className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label="Categories">
        {[{ slug: 'all', name: 'All' }, ...orderedCategories].map((cat) => {
          const active = category === cat.slug;
          return (
            <button
              key={cat.slug}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => update('category', cat.slug)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                active ? 'bg-tt-700 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:text-tt-700 hover:ring-tt-300'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {hasFilters && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>Active filters:</span>
          {urlSearch && <span className="badge bg-tt-50 text-tt-800">“{urlSearch}”</span>}
          {category !== 'all' && <span className="badge bg-tt-50 text-tt-800">{activeCategory?.name}</span>}
          <button type="button" onClick={clearFilters} className="btn-ghost btn-sm">
            <X className="size-3.5" /> Clear all
          </button>
        </div>
      )}

      {loading && <SkeletonGrid />}

      {!loading && error && (
        <EmptyState icon={Package} title="Products unavailable" description={error} />
      )}

      {!loading && !error && products.length === 0 && (
        <EmptyState
          icon={Search}
          title="No products match your search"
          description="Try a different keyword or clear the filters."
          action={<button type="button" className="btn-primary" onClick={clearFilters}>Show all products</button>}
        />
      )}

      {!loading && !error && products.length > 0 && (
        <div className="fade-in grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-3">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
