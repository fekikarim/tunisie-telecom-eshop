import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Banknote, Cable, Camera, Globe, Headphones, Plug, Router, ShieldCheck, Smartphone, Truck, Zap } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Spinner from '../components/Spinner.jsx';
import { api, getErrorMessage } from '../utils/api.js';
import { CATEGORY_ORDER, FREE_DELIVERY_FROM, formatTND } from '../utils/format.js';

const CATEGORY_ICONS = {
  smartphones: Smartphone,
  routers: Router,
  fiber: Cable,
  packages: Globe,
  audio: Headphones,
  'smart-home': Camera,
  accessories: Plug,
};

function ProductRow({ title, subtitle, products, loading, error }) {
  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
        </div>
        <Link to="/shop" className="hidden items-center gap-1 text-sm font-semibold text-tt-700 hover:text-tt-900 sm:inline-flex">
          View all <ArrowRight className="size-4" />
        </Link>
      </div>
      {loading && <Spinner label="Loading products…" className="py-16" />}
      {error && <p className="card p-6 text-sm text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState({ data: [], loading: true, error: '' });
  const [popular, setPopular] = useState({ data: [], loading: true, error: '' });

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => {});
    api.get('/products', { params: { sort: 'newest', limit: 4 } })
      .then((r) => setFeatured({ data: r.data, loading: false, error: '' }))
      .catch((e) => setFeatured({ data: [], loading: false, error: getErrorMessage(e, 'Could not load products.') }));
    api.get('/products', { params: { sort: 'popular', limit: 4 } })
      .then((r) => setPopular({ data: r.data, loading: false, error: '' }))
      .catch((e) => setPopular({ data: [], loading: false, error: getErrorMessage(e, 'Could not load products.') }));
  }, []);

  const orderedCategories = [...categories].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.slug) - CATEGORY_ORDER.indexOf(b.slug)
  );

  return (
    <div className="fade-in">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-10 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-tt-700 text-white shadow-lift">
          <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-32 right-40 size-80 rounded-full bg-white/5" />
          <div className="relative grid items-center gap-10 px-6 py-12 sm:px-10 sm:py-16 lg:grid-cols-[1.2fr_1fr] lg:px-14">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-tt-100">
                <Zap className="size-3.5 text-sun" /> Online store
              </p>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                Stay connected with the latest phones, routers and internet packages.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-tt-100/90 sm:text-lg">
                Order from home, pay on delivery or by card, and track every order from your account.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/shop" className="btn bg-white text-tt-800 shadow-md hover:bg-tt-50">
                  Shop now <ArrowRight className="size-4" />
                </Link>
                <Link to="/shop?category=packages" className="btn border border-white/30 bg-white/5 text-white hover:bg-white/10">
                  Internet packages
                </Link>
              </div>
            </div>
            <div className="hidden justify-center lg:flex">
              <div className="flex aspect-square w-80 items-center justify-center rounded-3xl bg-white p-10 shadow-lift ring-8 ring-white/10">
                <Logo className="w-full object-contain" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="mx-auto mt-6 grid max-w-7xl grid-cols-1 gap-3 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
        {[
          { icon: Truck, title: 'Delivery across Tunisia', text: `Free delivery from ${formatTND(FREE_DELIVERY_FROM)}` },
          { icon: Banknote, title: 'Cash on delivery', text: 'Pay when your order arrives' },
          { icon: ShieldCheck, title: 'Secure checkout', text: 'Order history and status in your account' },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="card flex items-center gap-4 p-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-tt-50 text-tt-600">
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{title}</p>
              <p className="text-xs text-muted">{text}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="section-title">Shop by category</h2>
        <p className="mt-1.5 text-sm text-muted">Find what you need, from devices to connectivity.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-7">
          {orderedCategories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.slug] || Smartphone;
            return (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.slug}`}
                className="card group flex flex-col items-start gap-3 p-4 transition duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-tt-50 text-tt-600 transition group-hover:bg-tt-700 group-hover:text-white">
                  <Icon className="size-5" />
                </span>
                <span className="text-sm font-semibold leading-tight text-ink">{cat.name}</span>
                <span className="text-xs text-muted">{cat.productCount} product{cat.productCount === 1 ? '' : 's'}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Promotional banners */}
      <section className="mx-auto mt-16 grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
        <Link to="/shop?category=packages" className="group relative overflow-hidden rounded-2xl bg-sun p-7 text-ink shadow-card transition hover:shadow-lift sm:p-9">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/70">Internet offer</p>
          <h3 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">Fibre 100 Mbps<br />from {formatTND(59)} / month</h3>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">
            Discover the offer <ArrowRight className="size-4 transition group-hover:translate-x-1" />
          </span>
          <Globe className="absolute -bottom-6 -right-6 size-40 text-ink/10" />
        </Link>
        <Link to="/shop" className="group relative overflow-hidden rounded-2xl bg-tt-100 p-7 text-tt-900 shadow-card transition hover:shadow-lift sm:p-9">
          <p className="text-xs font-bold uppercase tracking-wider text-tt-700">Delivery</p>
          <h3 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">Free delivery on orders<br />over {formatTND(FREE_DELIVERY_FROM)}</h3>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">
            Start shopping <ArrowRight className="size-4 transition group-hover:translate-x-1" />
          </span>
          <Truck className="absolute -bottom-6 -right-6 size-40 text-tt-700/10" />
        </Link>
      </section>

      <div className="mx-auto mt-16 flex max-w-7xl flex-col gap-16 px-4 sm:px-6 lg:px-8">
        <ProductRow
          title="Featured products"
          subtitle="Our newest arrivals"
          products={featured.data}
          loading={featured.loading}
          error={featured.error}
        />
        <ProductRow
          title="Popular right now"
          subtitle="The products our customers order most"
          products={popular.data}
          loading={popular.loading}
          error={popular.error}
        />
      </div>

      {/* Call to action */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-white p-8 shadow-card ring-1 ring-tt-100 sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="text-2xl font-bold text-ink">Ready to get connected?</h2>
            <p className="mt-1.5 text-sm text-muted">Create a free account to order, save your details and follow your deliveries.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/register" className="btn-primary">Create an account</Link>
            <Link to="/shop" className="btn-secondary">Browse the shop</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
