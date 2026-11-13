import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Banknote, CheckCircle2, Minus, Plus, ShieldCheck, ShoppingCart, Truck, XCircle } from 'lucide-react';
import ProductImage from '../components/ProductImage.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Spinner from '../components/Spinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api, getErrorMessage } from '../utils/api.js';
import { FREE_DELIVERY_FROM, formatTND } from '../utils/format.js';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const toast = useToast();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setQuantity(1);
    api.get(`/products/${id}`)
      .then(async (r) => {
        if (cancelled) return;
        setProduct(r.data);
        const { data } = await api.get('/products', { params: { category: r.data.categorySlug, limit: 5 } });
        if (!cancelled) setRelated(data.filter((p) => p.id !== r.data.id).slice(0, 4));
      })
      .catch((e) => {
        if (!cancelled) setError(e.response?.status === 404 ? 'notfound' : getErrorMessage(e, 'Could not load this product.'));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    window.scrollTo({ top: 0 });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="py-32"><Spinner label="Loading product…" /></div>;

  if (error === 'notfound') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState icon={XCircle} title="Product not found" description="This product may have been removed." action={<Link to="/shop" className="btn-primary">Back to the shop</Link>} />
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState icon={XCircle} title="Something went wrong" description={error} action={<button type="button" className="btn-primary" onClick={() => window.location.reload()}>Try again</button>} />
      </div>
    );
  }

  const outOfStock = product.stock <= 0;
  const maxQty = Math.min(product.stock, 99);

  const handleAdd = () => {
    const result = addItem(product, quantity);
    if (result.ok) {
      toast.success(`${quantity} × "${product.name}" added to your cart`);
    } else {
      toast.error(result.message);
    }
  };

  const handleBuyNow = () => {
    const result = addItem(product, quantity);
    if (!result.ok) return toast.error(result.message);
    navigate('/cart');
    return undefined;
  };

  return (
    <div className="fade-in mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link to="/shop" className="inline-flex items-center gap-1 hover:text-tt-700"><ArrowLeft className="size-4" /> Shop</Link>
        <span>/</span>
        <Link to={`/shop?category=${product.categorySlug}`} className="hover:text-tt-700">{product.categoryName}</Link>
        <span>/</span>
        <span className="truncate text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="card flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-b from-tt-50 to-white p-8 sm:p-12">
          <ProductImage src={product.imageUrl} alt={product.name} className="max-h-full" />
        </div>

        <div className="flex flex-col">
          <p className="text-sm font-semibold uppercase tracking-wider text-tt-600">{product.categoryName}</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">{product.name}</h1>

          <p className="mt-5 text-3xl font-bold text-tt-800">{formatTND(product.price)}</p>
          <p className="mt-1 text-xs text-muted">Prices include all applicable taxes. Delivery is calculated at checkout.</p>

          <div className="mt-5">
            {outOfStock ? (
              <p className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                <XCircle className="size-4" /> Out of stock
              </p>
            ) : (
              <p className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${product.stock <= 5 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>
                <CheckCircle2 className="size-4" />
                {product.stock <= 5 ? `Only ${product.stock} left in stock` : `In stock (${product.stock} available)`}
              </p>
            )}
          </div>

          <p className="mt-6 leading-relaxed text-slate-600">{product.description || 'No description available for this product yet.'}</p>

          {!outOfStock && (
            <div className="mt-8 rounded-2xl bg-white p-5 shadow-card ring-1 ring-tt-100">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="label mb-0">Quantity</p>
                  <div className="mt-2 inline-flex items-center rounded-xl ring-1 ring-inset ring-slate-300">
                    <button
                      type="button"
                      className="rounded-l-xl p-3 text-slate-600 hover:bg-tt-50 disabled:opacity-40"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-4" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={maxQty}
                      value={quantity}
                      onChange={(e) => {
                        const n = Number.parseInt(e.target.value, 10);
                        setQuantity(Number.isNaN(n) ? 1 : Math.min(Math.max(n, 1), maxQty));
                      }}
                      className="w-16 border-x border-slate-300 bg-transparent py-2.5 text-center font-semibold text-ink focus:outline-none"
                      aria-label="Quantity"
                    />
                    <button
                      type="button"
                      className="rounded-r-xl p-3 text-slate-600 hover:bg-tt-50 disabled:opacity-40"
                      onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                      disabled={quantity >= maxQty}
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-muted">Line total <span className="block text-lg font-bold text-ink">{formatTND(product.price * quantity)}</span></p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button type="button" className="btn-primary py-3" onClick={handleAdd}>
                  <ShoppingCart className="size-4" /> Add to cart
                </button>
                <button type="button" className="btn-secondary py-3" onClick={handleBuyNow}>Buy now</button>
              </div>
            </div>
          )}

          <ul className="mt-8 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
            <li className="flex items-center gap-2"><Truck className="size-4 text-tt-600" /> Free delivery over {formatTND(FREE_DELIVERY_FROM)}</li>
            <li className="flex items-center gap-2"><Banknote className="size-4 text-tt-600" /> Cash on delivery</li>
            <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-tt-600" /> Secure simulated payment</li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="section-title mb-6">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
