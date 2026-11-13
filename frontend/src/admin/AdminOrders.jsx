import { useEffect, useState } from 'react';
import { ClipboardList, Eye } from 'lucide-react';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ProductImage from '../components/ProductImage.jsx';
import Spinner from '../components/Spinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api, getErrorMessage } from '../utils/api.js';
import { formatDate, formatTND, ORDER_STATUSES } from '../utils/format.js';

function OrderDetail({ order, onUpdated }) {
  const toast = useToast();
  const [status, setStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => setStatus(order.status), [order.status]);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/orders/${order.id}/status`, { status });
      toast.success(`Order ${order.reference} is now ${data.status}`);
      onUpdated(data);
    } catch (e) {
      toast.error(getErrorMessage(e, 'The status could not be updated.'));
    } finally {
      setSaving(false);
      setConfirmCancel(false);
    }
  };

  const handleSave = () => {
    if (status === 'Cancelled' && order.status !== 'Cancelled') setConfirmCancel(true);
    else save();
  };

  const locked = order.status === 'Cancelled';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-muted">Reference</p><p className="mt-1 font-mono font-semibold">{order.reference}</p></div>
        <div><p className="text-xs font-semibold uppercase tracking-wider text-muted">Placed</p><p className="mt-1 text-sm">{formatDate(order.createdAt)}</p></div>
        <div><p className="text-xs font-semibold uppercase tracking-wider text-muted">Current status</p><div className="mt-1"><StatusBadge status={order.status} /></div></div>
      </div>

      <div className="grid gap-4 rounded-xl bg-slate-50 p-5 text-sm sm:grid-cols-2">
        <div>
          <p className="font-semibold text-ink">{order.customer.fullName}</p>
          <p className="text-slate-600">{order.customer.phone}</p>
          <p className="text-slate-600">{order.customer.email}</p>
        </div>
        <div>
          <p className="text-slate-600">{order.customer.address}, {order.customer.city}</p>
          {order.customer.notes && <p className="mt-1 text-slate-500">Note: {order.customer.notes}</p>}
          <p className="mt-2 text-slate-600">Payment: {order.paymentMethod === 'card' ? 'Card (simulated)' : 'Cash on delivery'} · {order.paymentStatus === 'paid' ? 'paid' : 'to collect'}</p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink">Items</h3>
        <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-tt-50 p-1"><ProductImage src={item.imageUrl} alt="" /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.productName}</p>
                <p className="text-xs text-muted">{item.quantity} × {formatTND(item.unitPrice)}</p>
              </div>
              <p className="text-sm font-semibold">{formatTND(item.lineTotal)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatTND(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{order.deliveryFee === 0 ? 'Free' : formatTND(order.deliveryFee)}</dd></div>
          <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold"><dt>Total</dt><dd className="text-tt-800">{formatTND(order.total)}</dd></div>
        </dl>
      </div>

      <div className="rounded-xl border border-tt-100 bg-tt-50/50 p-5">
        <label htmlFor="status" className="label">Update status</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <select id="status" className="input sm:flex-1" value={status} onChange={(e) => setStatus(e.target.value)} disabled={locked || saving}>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="button" className="btn-primary" onClick={handleSave} disabled={locked || saving || status === order.status}>
            {saving ? 'Saving…' : 'Save status'}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">
          {locked ? 'Cancelled orders are final and their stock has been returned.' : 'Cancelling an order returns its items to stock.'}
        </p>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this order?"
        message={`Order ${order.reference} will be cancelled and its items (${order.itemCount}) returned to stock. A cancelled order cannot be reopened.`}
        confirmLabel="Cancel order"
        busy={saving}
        onConfirm={save}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null); // full order detail
  const [loadingDetail, setLoadingDetail] = useState(false);
  const toast = useToast();

  const load = async () => {
    setError('');
    try {
      const { data } = await api.get('/orders', { params: filter ? { status: filter } : {} });
      setOrders(data);
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load orders.'));
    }
  };

  useEffect(() => { setOrders(null); load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filter]);

  const openOrder = async (id) => {
    setLoadingDetail(true);
    try {
      const { data } = await api.get(`/orders/${id}`);
      setSelected(data);
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not open this order.'));
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleUpdated = (updated) => {
    setSelected(updated);
    setOrders((list) => list.map((o) => (o.id === updated.id ? { ...o, status: updated.status, updatedAt: updated.updatedAt } : o)));
  };

  return (
    <div className="fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Orders</h1>
          <p className="mt-1 text-sm text-muted">Review customer orders and update their progress.</p>
        </div>
        <div className="sm:w-60">
          <label htmlFor="order-filter" className="sr-only">Filter by status</label>
          <select id="order-filter" className="input" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {!orders && !error && <Spinner label="Loading orders…" className="py-20" />}
      {error && <EmptyState title="Orders unavailable" description={error} />}
      {orders && orders.length === 0 && (
        <EmptyState icon={ClipboardList} title="No orders found" description={filter ? 'No orders have this status.' : 'Orders will appear here once customers check out.'} />
      )}

      {orders && orders.length > 0 && (
        <>
          <div className="card hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-tt-50/70 text-xs font-semibold uppercase tracking-wider text-tt-800">
                <tr>
                  <th className="px-5 py-3.5">Reference</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-center">Items</th>
                  <th className="px-5 py-3.5 text-right">Total</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="cursor-pointer transition hover:bg-slate-50/70" onClick={() => openOrder(o.id)}>
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-ink">{o.reference}</td>
                    <td className="px-5 py-3.5"><p className="font-medium text-ink">{o.customer.fullName}</p><p className="text-xs text-muted">{o.customer.email}</p></td>
                    <td className="px-5 py-3.5 text-slate-600">{formatDate(o.createdAt)}</td>
                    <td className="px-5 py-3.5 text-center">{o.itemCount}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-tt-800">{formatTND(o.total)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <button type="button" className="btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); openOrder(o.id); }} aria-label={`View order ${o.reference}`}>
                        <Eye className="size-4" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="grid gap-3 md:hidden">
            {orders.map((o) => (
              <li key={o.id}>
                <button type="button" onClick={() => openOrder(o.id)} className="card w-full p-4 text-left transition hover:shadow-lift">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-semibold text-ink">{o.reference}</p>
                      <p className="mt-1 truncate font-medium text-ink">{o.customer.fullName}</p>
                      <p className="text-xs text-muted">{formatDate(o.createdAt)} · {o.itemCount} item(s)</p>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="mt-3 text-right font-bold text-tt-800">{formatTND(o.total)}</p>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected ? `Order ${selected.reference}` : 'Order'} size="lg">
        {loadingDetail && <Spinner label="Loading order…" className="py-10" />}
        {selected && !loadingDetail && <OrderDetail order={selected} onUpdated={handleUpdated} />}
      </Modal>
    </div>
  );
}
