import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import Field from '../components/Field.jsx';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage, getFieldErrors } from '../utils/api.js';

const EMPTY = { name: '', email: '', phone: '', address: '', password: '', confirm: '' };

function validate(f) {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Enter your full name';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'Enter a valid email address';
  if (f.phone && !/^\+?[\d\s()-]{6,20}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number';
  if (f.password.length < 8) e.password = 'Use at least 8 characters';
  else if (!/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) e.password = 'Include at least one letter and one number';
  if (f.confirm !== f.password) e.confirm = 'Passwords do not match';
  return e;
}

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const local = validate(form);
    setErrors(local);
    setFormError('');
    if (Object.keys(local).length) return;

    setBusy(true);
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        password: form.password,
      });
      toast.success(`Welcome to Tunisie Telecom, ${user.name.split(' ')[0]}!`);
      navigate('/', { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err, 'We could not create your account.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fade-in flex min-h-[calc(100dvh-16rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="h-16 w-auto" />
          <h1 className="mt-5 text-2xl font-bold text-ink">Create your account</h1>
          <p className="mt-1.5 text-sm text-muted">It takes less than a minute.</p>
        </div>

        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
            {formError && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 sm:col-span-2">{formError}</div>
            )}
            <Field label="Full name" htmlFor="name" error={errors.name} className="sm:col-span-2">
              <input id="name" className="input" autoComplete="name" value={form.name} onChange={set('name')} aria-invalid={Boolean(errors.name)} />
            </Field>
            <Field label="Email" htmlFor="email" error={errors.email} className="sm:col-span-2">
              <input id="email" type="email" className="input" autoComplete="email" value={form.email} onChange={set('email')} aria-invalid={Boolean(errors.email)} />
            </Field>
            <Field label="Phone (optional)" htmlFor="phone" error={errors.phone}>
              <input id="phone" type="tel" className="input" autoComplete="tel" placeholder="+216 " value={form.phone} onChange={set('phone')} aria-invalid={Boolean(errors.phone)} />
            </Field>
            <Field label="Address (optional)" htmlFor="address" error={errors.address}>
              <input id="address" className="input" autoComplete="street-address" value={form.address} onChange={set('address')} />
            </Field>
            <Field label="Password" htmlFor="password" error={errors.password} hint={!errors.password ? 'At least 8 characters, with a letter and a number' : undefined}>
              <input id="password" type="password" className="input" autoComplete="new-password" value={form.password} onChange={set('password')} aria-invalid={Boolean(errors.password)} />
            </Field>
            <Field label="Confirm password" htmlFor="confirm" error={errors.confirm}>
              <input id="confirm" type="password" className="input" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} aria-invalid={Boolean(errors.confirm)} />
            </Field>
            <button type="submit" disabled={busy} className="btn-primary w-full py-3 sm:col-span-2">
              <UserPlus className="size-4" /> {busy ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Already registered? <Link to="/login" className="font-semibold text-tt-700 hover:text-tt-900">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
