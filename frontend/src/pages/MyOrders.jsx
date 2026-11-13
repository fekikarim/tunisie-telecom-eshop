import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, PackageOpen } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import ProductImage from '../components/ProductImage.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Spinner from '../components/Spinner.jsx';
import { api, getErrorMessage } from '../utils/api.js';
import { formatDate, formatTND } from '../utils/format.js';

export default function MyOrders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    api.get('/orders/my-orders')
      .then((r) => { setOrders(r.data); if (r.data[0]) setOpenId(r.data[0].id); })
      .catch((e) => setError(getErrorMessage(e, 'Could not load your orders.')));
  }, []);

  return (
    <div className="fade-in mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">My orders</h1>
      <p className="mt-2 text-sm text-muted">Track your purchases and their current status.</p>

      <div className="mt-8">
        {!orders && !error && <Spinner label="Loading your orders…" className="py-24" />}
        {error && <EmptyState icon={PackageOpen} title="Orders unavailable" description={error} />}
        {orders && orders.length === 0 && (
          <EmptyState
            icon={PackageOpen}
            title="No orders yet"
            description="When you place an order, it will appear here with its status."
            action={<Link to="/shop" className="btn-primary">Browse products</Link>}
          />
        )}

        {orders && orders.length > 0 && (
          <ul className="space-y-4">
            {orders.map((order) => {
              const open = openId === order.id;
              return (
                <li key={order.id} className="card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : order.id)}
                    className="flex w-full flex-wrap items-center gap-x-6 gap-y-3 p-5 text-left transition hover:bg-tt-50/50 sm:p-6"
                    aria-expanded={open}
                  >
                    <div className="min-w-40">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Reference</p>
                      <p className="mt-0.5 font-mono text-sm font-semibold text-ink">{order.reference}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Placed</p>
                      <p className="mt-0.5 text-sm text-ink">{formatDate(order.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Items</p>
                      <p className="mt-0.5 text-sm text-ink">{order.itemCount}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Total</p>
                      <p className="mt-0.5 text-sm font-bold text-tt-800">{formatTND(order.total)}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                      <StatusBadge status={order.status} />
                      <ChevronDown className={`size-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {open && (
                    <div className="fade-in border-t border-slate-100 bg-slate-50/50 p-5 sm:p-6">
                      <ul className="divide-y divide-slate-200/70">
                        {order.items.map((item) => (
                          <li key={item.id} className="flex items-center gap-4 py-3">
                            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1.5 ring-1 ring-slate-200">
                              <ProductImage src={item.imageUrl} alt="" />
                            </div>
                            <div className="min-w-0 flex-1">
                              {item.productId ? (
                                <Link to={`/products/${item.productId}`} className="font-medium text-ink hover:text-tt-700">{item.productName}</Link>
                              ) : (
                                <p className="font-medium text-ink">{item.productName}</p>
                              )}
                              <p className="text-sm text-muted">{item.quantity} × {formatTND(item.unitPrice)}</p>
                            </div>
                            <p className="font-semibold">{formatTND(item.lineTotal)}</p>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                          <p className="font-semibold text-ink">Delivery to</p>
                          <p className="mt-1 text-slate-600">{order.customer.address}, {order.customer.city}</p>
                          <p className="text-slate-600">{order.customer.phone}</p>
                        </div>
                        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                          <p className="font-semibold text-ink">Payment</p>
                          <p className="mt-1 text-slate-600">{order.paymentMethod === 'card' ? 'Card (simulated)' : 'Cash on delivery'} · {order.paymentStatus === 'paid' ? 'Paid' : 'To pay on delivery'}</p>
                          <p className="mt-3 text-slate-600">Subtotal {formatTND(order.subtotal)} · Delivery {order.deliveryFee === 0 ? 'free' : formatTND(order.deliveryFee)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
