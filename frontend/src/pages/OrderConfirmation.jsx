import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, ClipboardList, XCircle } from 'lucide-react';
import ProductImage from '../components/ProductImage.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Spinner from '../components/Spinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { api, getErrorMessage } from '../utils/api.js';
import { formatDate, formatTND } from '../utils/format.js';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then((r) => setOrder(r.data))
      .catch((e) => setError(getErrorMessage(e, 'Order not found.')));
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState icon={XCircle} title="Order not found" description={error} action={<Link to="/orders" className="btn-primary">My orders</Link>} />
      </div>
    );
  }
  if (!order) return <div className="py-32"><Spinner label="Loading your order…" /></div>;

  return (
    <div className="fade-in mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="card overflow-hidden">
        <div className="bg-tt-700 px-6 py-10 text-center text-white sm:px-10">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-white/15">
            <CheckCircle2 className="size-9 text-sun" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold sm:text-3xl">Thank you, your order is confirmed!</h1>
          <p className="mt-2 text-sm text-tt-100">
            Order reference <span className="font-mono font-semibold text-white">{order.reference}</span>
          </p>
        </div>

        <div className="space-y-8 p-6 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <div>
              <p className="text-muted">Status</p>
              <div className="mt-1"><StatusBadge status={order.status} /></div>
            </div>
            <div>
              <p className="text-muted">Payment</p>
              <p className="mt-1 font-medium">
                {order.paymentMethod === 'card' ? 'Card (simulated), paid' : 'Cash on delivery'}
              </p>
            </div>
            <div>
              <p className="text-muted">Placed on</p>
              <p className="mt-1 font-medium">{formatDate(order.createdAt)}</p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Items</h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-4">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-tt-50 p-2">
                    <ProductImage src={item.imageUrl} alt="" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{item.productName}</p>
                    <p className="text-sm text-muted">{item.quantity} × {formatTND(item.unitPrice)}</p>
                  </div>
                  <p className="font-semibold">{formatTND(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatTND(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{order.deliveryFee === 0 ? 'Free' : formatTND(order.deliveryFee)}</dd></div>
              <div className="flex justify-between pt-2 text-base"><dt className="font-semibold">Total</dt><dd className="text-xl font-extrabold text-tt-800">{formatTND(order.total)}</dd></div>
            </dl>
          </div>

          <div className="rounded-xl bg-slate-50 p-5 text-sm">
            <p className="font-semibold text-ink">Delivery to</p>
            <p className="mt-1 text-slate-600">{order.customer.fullName}</p>
            <p className="text-slate-600">{order.customer.address}, {order.customer.city}</p>
            <p className="text-slate-600">{order.customer.phone}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link to="/shop" className="btn-secondary">Continue shopping</Link>
            <Link to="/orders" className="btn-primary"><ClipboardList className="size-4" /> View my orders</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
