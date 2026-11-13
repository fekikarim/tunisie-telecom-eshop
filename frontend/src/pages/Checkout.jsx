import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Banknote, CreditCard, Lock, ShieldCheck } from 'lucide-react';
import Field from '../components/Field.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api, getErrorMessage, getFieldErrors } from '../utils/api.js';
import { DELIVERY_FEE, FREE_DELIVERY_FROM, TUNISIAN_GOVERNORATES, formatTND } from '../utils/format.js';

const SERVER_TO_FIELD = {
  'customer.fullName': 'fullName',
  'customer.phone': 'phone',
  'customer.email': 'email',
  'customer.address': 'address',
  'customer.city': 'city',
  'customer.notes': 'notes',
  'card.number': 'cardNumber',
  'card.name': 'cardName',
  'card.expiry': 'cardExpiry',
  'card.cvc': 'cardCvc',
};

const luhn = (digits) => {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = Number(digits[i]);
    if (double) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
};

function validate(form) {
  const e = {};
  if (form.fullName.trim().length < 2) e.fullName = 'Enter your full name';
  if (!/^\+?[\d\s()-]{6,20}$/.test(form.phone.trim())) e.phone = 'Enter a valid phone number, e.g. +216 98 123 456';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) e.email = 'Enter a valid email address';
  if (form.address.trim().length < 5) e.address = 'Enter a street address (at least 5 characters)';
  if (!form.city) e.city = 'Choose your governorate';
  if (form.paymentMethod === 'card') {
    const digits = form.cardNumber.replace(/\s/g, '');
    if (!/^\d{12,19}$/.test(digits) || !luhn(digits)) e.cardNumber = 'Enter a valid card number (simulation accepts test numbers such as 4111 1111 1111 1111)';
    if (form.cardName.trim().length < 2) e.cardName = 'Enter the name printed on the card';
    const m = /^(\d{2})\/(\d{2})$/.exec(form.cardExpiry.trim());
    const now = new Date();
    if (!m || Number(m[1]) < 1 || Number(m[1]) > 12 || 2000 + Number(m[2]) < now.getFullYear()
      || (2000 + Number(m[2]) === now.getFullYear() && Number(m[1]) < now.getMonth() + 1)) {
      e.cardExpiry = 'Enter an expiry date in MM/YY format';
    }
    if (!/^\d{3,4}$/.test(form.cardCvc)) e.cardCvc = 'CVC must be 3 or 4 digits';
  }
  return e;
}

function Section({ step, title, children }) {
  return (
    <section className="card p-5 sm:p-7">
      <h2 className="mb-5 flex items-center gap-3 text-lg font-semibold text-ink">
        <span className="flex size-7 items-center justify-center rounded-full bg-tt-700 text-sm text-white">{step}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function Checkout() {
  const { user } = useAuth();
  const { items, subtotal, clearCart, refresh } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: user?.address || '',
    city: '',
    notes: '',
    paymentMethod: 'cod',
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const delivery = subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
  const total = subtotal + delivery;
  const itemCount = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  if (items.length === 0 && !submitting) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-ink">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted">Add products before checking out.</p>
        <Link to="/shop" className="btn-primary mt-6">Go to the shop</Link>
      </div>
    );
  }

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const localErrors = validate(form);
    setErrors(localErrors);
    if (Object.keys(localErrors).length) {
      setFormError('Please correct the highlighted fields.');
      return;
    }

    const payload = {
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      customer: {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        city: form.city,
        notes: form.notes.trim(),
      },
      paymentMethod: form.paymentMethod,
      ...(form.paymentMethod === 'card'
        ? { card: { name: form.cardName.trim(), number: form.cardNumber, expiry: form.cardExpiry.trim(), cvc: form.cardCvc } }
        : {}),
    };

    setSubmitting(true);
    try {
      const { data: order } = await api.post('/orders', payload);
      clearCart();
      toast.success(`Order ${order.reference} confirmed`);
      navigate(`/orders/${order.id}/confirmation`, { replace: true });
    } catch (err) {
      const serverErrors = getFieldErrors(err);
      const mapped = {};
      Object.entries(serverErrors).forEach(([key, msg]) => { mapped[SERVER_TO_FIELD[key] || key] = msg; });
      setErrors(mapped);
      const message = getErrorMessage(err, 'We could not place your order. Please try again.');
      setFormError(message);
      if (err.response?.status === 409 || err.response?.status === 404) {
        refresh().catch(() => {});
      }
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const input = (key, props = {}) => ({
    id: key,
    name: key,
    value: form[key],
    onChange: set(key),
    'aria-invalid': Boolean(errors[key]),
    className: 'input',
    ...props,
  });

  return (
    <div className="fade-in mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Checkout</h1>
      <p className="mt-2 text-sm text-muted">Complete your delivery details and choose how you want to pay.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {formError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {formError}
            </div>
          )}

          <Section step="1" title="Contact details">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name" htmlFor="fullName" error={errors.fullName}>
                <input {...input('fullName', { autoComplete: 'name', maxLength: 100 })} />
              </Field>
              <Field label="Phone number" htmlFor="phone" error={errors.phone}>
                <input {...input('phone', { type: 'tel', autoComplete: 'tel', placeholder: '+216 ' })} />
              </Field>
              <Field label="Email" htmlFor="email" error={errors.email} className="sm:col-span-2">
                <input {...input('email', { type: 'email', autoComplete: 'email' })} />
              </Field>
            </div>
          </Section>

          <Section step="2" title="Delivery address">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Street address" htmlFor="address" error={errors.address} className="sm:col-span-2">
                <input {...input('address', { autoComplete: 'street-address', maxLength: 255, placeholder: 'Street, building, apartment' })} />
              </Field>
              <Field label="Governorate" htmlFor="city" error={errors.city}>
                <select {...input('city', { autoComplete: 'address-level1' })}>
                  <option value="">Select a governorate</option>
                  {TUNISIAN_GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Delivery notes (optional)" htmlFor="notes" error={errors.notes}>
                <input {...input('notes', { maxLength: 500, placeholder: 'Landmark, preferred time…' })} />
              </Field>
            </div>
          </Section>

          <Section step="3" title="Payment">
            <fieldset className="grid gap-3 sm:grid-cols-2">
              <legend className="sr-only">Payment method</legend>
              {[
                { value: 'cod', title: 'Cash on delivery', text: 'Pay the courier when you receive your order.', icon: Banknote },
                { value: 'card', title: 'Card (simulated)', text: 'Instant confirmation. No real payment is made.', icon: CreditCard },
              ].map(({ value, title, text, icon: Icon }) => {
                const active = form.paymentMethod === value;
                return (
                  <label
                    key={value}
                    className={`flex cursor-pointer gap-3 rounded-xl p-4 ring-1 transition ${active ? 'bg-tt-50 ring-2 ring-tt-600' : 'bg-white ring-slate-200 hover:ring-tt-300'}`}
                  >
                    <input type="radio" name="paymentMethod" value={value} checked={active} onChange={set('paymentMethod')} className="mt-1 accent-tt-700" />
                    <span>
                      <span className="flex items-center gap-2 font-semibold text-ink"><Icon className="size-4 text-tt-600" /> {title}</span>
                      <span className="mt-1 block text-sm text-muted">{text}</span>
                    </span>
                  </label>
                );
              })}
            </fieldset>

            {form.paymentMethod === 'card' && (
              <div className="fade-in mt-6 rounded-xl bg-slate-50 p-5">
                <p className="mb-4 flex items-center gap-2 text-xs font-medium text-slate-600">
                  <Lock className="size-3.5" /> Demo only. Card details are validated but never stored or charged.
                </p>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Name on card" htmlFor="cardName" error={errors.cardName} className="sm:col-span-2">
                    <input {...input('cardName', { autoComplete: 'cc-name' })} />
                  </Field>
                  <Field label="Card number" htmlFor="cardNumber" error={errors.cardNumber} className="sm:col-span-2" hint="Test number: 4111 1111 1111 1111">
                    <input {...input('cardNumber', { inputMode: 'numeric', autoComplete: 'cc-number', placeholder: '1234 5678 9012 3456' })} />
                  </Field>
                  <Field label="Expiry (MM/YY)" htmlFor="cardExpiry" error={errors.cardExpiry}>
                    <input {...input('cardExpiry', { autoComplete: 'cc-exp', placeholder: 'MM/YY', maxLength: 5 })} />
                  </Field>
                  <Field label="CVC" htmlFor="cardCvc" error={errors.cardCvc}>
                    <input {...input('cardCvc', { inputMode: 'numeric', autoComplete: 'cc-csc', placeholder: '123', maxLength: 4 })} />
                  </Field>
                </div>
              </div>
            )}
          </Section>
        </div>

        {/* Order summary */}
        <aside className="h-fit lg:sticky lg:top-28">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-ink">Order summary</h2>
            <ul className="mt-5 max-h-72 space-y-4 overflow-y-auto pr-1">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-3">
                  <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-tt-50 p-1">
                    <ProductImage src={item.imageUrl} alt="" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium text-ink">{item.name}</p>
                    <p className="text-xs text-muted">Qty {item.quantity} × {formatTND(item.price)}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatTND(item.price * item.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-6 space-y-2.5 border-t border-slate-100 pt-5 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Items ({itemCount})</dt><dd>{formatTND(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{delivery === 0 ? <span className="text-emerald-700">Free</span> : formatTND(delivery)}</dd></div>
              <div className="flex justify-between border-t border-slate-100 pt-3 text-base">
                <dt className="font-semibold text-ink">Total to pay</dt>
                <dd className="text-xl font-extrabold text-tt-800">{formatTND(total)}</dd>
              </div>
            </dl>
            <button type="submit" disabled={submitting} className="btn-accent mt-6 w-full py-3.5 text-base">
              {submitting ? 'Placing your order…' : `Confirm order · ${formatTND(total)}`}
            </button>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted">
              <ShieldCheck className="size-3.5" /> Totals are recalculated securely on our server.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
