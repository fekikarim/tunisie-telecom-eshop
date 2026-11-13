import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Minus, Plus, ShoppingBag, ShoppingCart, Trash2 } from 'lucide-react';
import ProductImage from '../components/ProductImage.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Spinner from '../components/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage } from '../utils/api.js';
import { DELIVERY_FEE, FREE_DELIVERY_FROM, formatTND } from '../utils/format.js';

export default function Cart() {
  const { items, count, subtotal, setQuantity, removeItem, refresh } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(true);

  // Pull current prices and stock once when the page opens.
  useEffect(() => {
    refresh()
      .catch((e) => toast.error(getErrorMessage(e, 'Could not refresh cart prices.')))
      .finally(() => setSyncing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (syncing && items.length > 0) {
    return <div className="py-32"><Spinner label="Updating your cart…" /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Browse our phones, routers and internet packages to get started."
          action={<Link to="/shop" className="btn-primary">Start shopping <ArrowRight className="size-4" /></Link>}
        />
      </div>
    );
  }

  const delivery = subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
  const total = subtotal + delivery;

  const handleCheckout = () => {
    navigate(user ? '/checkout' : '/login', { state: user ? undefined : { from: '/checkout' } });
  };

  return (
    <div className="fade-in mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Shopping cart</h1>
      <p className="mt-2 text-sm text-muted">{count} item{count === 1 ? '' : 's'} in your cart</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.productId} className="card flex gap-4 p-4 sm:gap-6 sm:p-5">
              <Link to={`/products/${item.productId}`} className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-tt-50 p-2 sm:size-28">
                <ProductImage src={item.imageUrl} alt={item.name} />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/products/${item.productId}`} className="line-clamp-2 font-semibold text-ink hover:text-tt-700">{item.name}</Link>
                    <p className="mt-1 text-sm text-muted">{formatTND(item.price)} each</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { removeItem(item.productId); toast.info(`"${item.name}" removed from your cart`); }}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                  <div className="inline-flex items-center rounded-xl ring-1 ring-inset ring-slate-300">
                    <button
                      type="button"
                      className="rounded-l-xl p-2.5 text-slate-600 hover:bg-tt-50 disabled:opacity-40"
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="min-w-12 text-center text-sm font-semibold" aria-live="polite">{item.quantity}</span>
                    <button
                      type="button"
                      className="rounded-r-xl p-2.5 text-slate-600 hover:bg-tt-50 disabled:opacity-40"
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= Math.min(item.stock, 99)}
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                  <p className="font-bold text-ink">{formatTND(item.price * item.quantity)}</p>
                </div>
                {item.quantity >= item.stock && (
                  <p className="mt-2 text-xs font-medium text-amber-700">Maximum available quantity reached ({item.stock})</p>
                )}
              </div>
            </li>
          ))}
        </ul>

        <aside className="card h-fit p-6 lg:sticky lg:top-28">
          <h2 className="text-lg font-semibold text-ink">Order summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal ({count} items)</dt><dd className="font-medium">{formatTND(subtotal)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-muted">Delivery</dt>
              <dd className="font-medium">{delivery === 0 ? <span className="text-emerald-700">Free</span> : formatTND(delivery)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-4 text-base">
              <dt className="font-semibold text-ink">Total</dt>
              <dd className="text-xl font-extrabold text-tt-800">{formatTND(total)}</dd>
            </div>
          </dl>
          {delivery > 0 && (
            <p className="mt-4 rounded-lg bg-sun-50 px-3 py-2 text-xs text-amber-900">
              Add {formatTND(FREE_DELIVERY_FROM - subtotal)} more to get free delivery.
            </p>
          )}
          <button type="button" onClick={handleCheckout} className="btn-primary mt-6 w-full py-3">
            <ShoppingBag className="size-4" /> Proceed to checkout
          </button>
          <Link to="/shop" className="btn-ghost mt-2 w-full">Continue shopping</Link>
          <p className="mt-4 text-center text-xs text-muted">The final total is confirmed by the server at checkout.</p>
        </aside>
      </div>
    </div>
  );
}
