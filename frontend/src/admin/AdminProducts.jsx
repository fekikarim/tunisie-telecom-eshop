import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ProductImage from '../components/ProductImage.jsx';
import Spinner from '../components/Spinner.jsx';
import ProductForm from './ProductForm.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api, getErrorMessage } from '../utils/api.js';
import { formatTND } from '../utils/format.js';

function StockBadge({ stock }) {
  if (stock === 0) return <span className="badge bg-red-100 text-red-700">Out of stock</span>;
  if (stock <= 5) return <span className="badge bg-amber-100 text-amber-800">{stock} left</span>;
  return <span className="badge bg-emerald-100 text-emerald-800">{stock} in stock</span>;
}

export default function AdminProducts() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editing, setEditing] = useState(null); // null = closed, {} = new, product = edit
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setError('');
    try {
      const [p, c] = await Promise.all([api.get('/products', { params: { sort: 'newest' } }), api.get('/categories')]);
      setProducts(p.data);
      setCategories(c.data);
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load products.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) =>
      (categoryFilter === 'all' || p.categorySlug === categoryFilter)
      && (!q || p.name.toLowerCase().includes(q) || p.categoryName.toLowerCase().includes(q))
    );
  }, [products, query, categoryFilter]);

  const handleSaved = (saved, wasEdit) => {
    setProducts((list) => (wasEdit ? list.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...list]));
    toast.success(wasEdit ? `"${saved.name}" updated` : `"${saved.name}" created and now visible in the shop`);
    setEditing(null);
    load();
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/products/${toDelete.id}`);
      setProducts((list) => list.filter((p) => p.id !== toDelete.id));
      toast.success(`"${toDelete.name}" deleted`);
      setToDelete(null);
    } catch (e) {
      toast.error(getErrorMessage(e, 'The product could not be deleted.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Products</h1>
          <p className="mt-1 text-sm text-muted">{products.length} product(s) in the catalogue. Changes appear in the shop immediately.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setEditing({})}>
          <Plus className="size-4" /> New product
        </button>
      </div>

      <div className="card flex flex-col gap-3 p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search by name or category" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search products" />
        </div>
        <select className="input sm:w-56" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filter by category">
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
      </div>

      {loading && <Spinner label="Loading products…" className="py-20" />}
      {!loading && error && <EmptyState title="Products unavailable" description={error} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState title="No products found" description="Try another search, or create a new product." action={<button type="button" className="btn-primary" onClick={() => setEditing({})}><Plus className="size-4" /> New product</button>} />
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          {/* Table for larger screens */}
          <div className="card hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-tt-50/70 text-xs font-semibold uppercase tracking-wider text-tt-800">
                  <tr>
                    <th className="px-5 py-3.5">Product</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5 text-right">Price</th>
                    <th className="px-5 py-3.5">Stock</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p) => (
                    <tr key={p.id} className="transition hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-tt-50 p-1">
                            <ProductImage src={p.imageUrl} alt="" />
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-1 font-semibold text-ink">{p.name}</p>
                            <p className="text-xs text-muted">#{p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{p.categoryName}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-tt-800">{formatTND(p.price)}</td>
                      <td className="px-5 py-3.5"><StockBadge stock={p.stock} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1">
                          <button type="button" className="btn-ghost btn-sm" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}><Pencil className="size-4" /> Edit</button>
                          <button type="button" className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setToDelete(p)} aria-label={`Delete ${p.name}`}><Trash2 className="size-4" /> Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cards for small screens */}
          <ul className="grid gap-3 md:hidden">
            {filtered.map((p) => (
              <li key={p.id} className="card p-4">
                <div className="flex gap-3">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-tt-50 p-1.5">
                    <ProductImage src={p.imageUrl} alt="" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-semibold text-ink">{p.name}</p>
                    <p className="text-xs text-muted">{p.categoryName}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="font-bold text-tt-800">{formatTND(p.price)}</span>
                      <StockBadge stock={p.stock} />
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" className="btn-secondary btn-sm" onClick={() => setEditing(p)}><Pencil className="size-4" /> Edit</button>
                  <button type="button" className="btn-danger btn-sm" onClick={() => setToDelete(p)}><Trash2 className="size-4" /> Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? `Edit product #${editing.id}` : 'New product'}
        size="lg"
      >
        {editing !== null && (
          <ProductForm
            product={editing?.id ? editing : null}
            categories={categories}
            onSaved={handleSaved}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this product?"
        message={toDelete ? `"${toDelete.name}" will be removed from the shop and the database. Past orders keep their product name and price. This cannot be undone.` : ''}
        confirmLabel="Delete product"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
