import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, ClipboardList, Package, TrendingUp, Users, Wallet } from 'lucide-react';
import StatusBadge from '../components/StatusBadge.jsx';
import Spinner from '../components/Spinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { api, getErrorMessage } from '../utils/api.js';
import { formatDate, formatTND, ORDER_STATUSES, STATUS_STYLES } from '../utils/format.js';

function StatCard({ icon: Icon, label, value, hint, tone = 'tt' }) {
  const tones = {
    tt: 'bg-tt-50 text-tt-700',
    sun: 'bg-sun-50 text-amber-700',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span className={`flex size-10 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="size-5" /></span>
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((r) => setData(r.data))
      .catch((e) => setError(getErrorMessage(e, 'Could not load dashboard statistics.')));
  }, []);

  if (error) return <EmptyState icon={AlertTriangle} title="Dashboard unavailable" description={error} />;
  if (!data) return <div className="py-32"><Spinner label="Loading statistics…" /></div>;

  const { totals, ordersByStatus, recentOrders, lowStockProducts, revenueTrend } = data;
  const maxRevenue = Math.max(1, ...revenueTrend.map((d) => d.revenue));
  const totalOrders = Math.max(1, totals.orders);

  return (
    <div className="fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">An overview of your store's products, customers and sales.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={Package} label="Products" value={totals.products} hint={`${totals.lowStock} low on stock`} />
        <StatCard icon={ClipboardList} label="Orders" value={totals.orders} hint={`${ordersByStatus.Pending} pending`} tone="sun" />
        <StatCard icon={Users} label="Customers" value={totals.customers} hint="Registered accounts" tone="green" />
        <StatCard icon={Wallet} label="Revenue" value={formatTND(totals.revenue)} hint="Excludes cancelled orders" tone="green" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Revenue trend */}
        <section className="card p-6 xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-ink">Revenue, last 7 days</h2>
              <p className="text-xs text-muted">Excluding cancelled orders</p>
            </div>
            <TrendingUp className="size-5 text-tt-600" />
          </div>
          <div className="flex h-56 items-end gap-2 sm:gap-4" role="img" aria-label="Bar chart of revenue per day">
            {revenueTrend.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[11px] font-semibold text-tt-800">{d.revenue ? Math.round(d.revenue) : ''}</span>
                <div className="flex h-40 w-full items-end">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-tt-700 to-tt-400 transition-all duration-500"
                    style={{ height: `${Math.max(2, (d.revenue / maxRevenue) * 100)}%` }}
                    title={`${d.day}: ${formatTND(d.revenue)} · ${d.orders} order(s)`}
                  />
                </div>
                <span className="text-[11px] text-muted">{new Date(`${d.day}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short' })}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Orders by status */}
        <section className="card p-6">
          <h2 className="font-semibold text-ink">Orders by status</h2>
          <p className="mb-5 text-xs text-muted">{totals.orders} order(s) in total</p>
          <ul className="space-y-4">
            {ORDER_STATUSES.map((status) => {
              const n = ordersByStatus[status] || 0;
              return (
                <li key={status}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-medium text-ink">{status}</span>
                    <span className="text-muted">{n}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${STATUS_STYLES[status].split(' ')[0]} transition-all duration-500`} style={{ width: `${(n / totalOrders) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Recent orders */}
        <section className="card xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="font-semibold text-ink">Recent orders</h2>
            <Link to="/admin/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-tt-700 hover:text-tt-900">View all <ArrowRight className="size-4" /></Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentOrders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4">
                  <div className="min-w-36">
                    <p className="font-mono text-sm font-semibold text-ink">{o.reference}</p>
                    <p className="text-xs text-muted">{formatDate(o.createdAt)}</p>
                  </div>
                  <p className="flex-1 text-sm text-slate-600">{o.customerName} · {o.itemCount} item(s)</p>
                  <p className="text-sm font-semibold">{formatTND(o.total)}</p>
                  <StatusBadge status={o.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Low stock */}
        <section className="card p-6">
          <h2 className="font-semibold text-ink">Low stock</h2>
          <p className="mb-4 text-xs text-muted">Products with 5 units or fewer</p>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-muted">All products are well stocked.</p>
          ) : (
            <ul className="space-y-3">
              {lowStockProducts.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <span className="line-clamp-1 text-sm font-medium text-ink">{p.name}</span>
                  <span className={`badge ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                    {p.stock === 0 ? 'Out' : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
