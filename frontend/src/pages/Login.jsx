import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import Field from '../components/Field.jsx';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage } from '../utils/api.js';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (!form.password) next.password = 'Enter your password';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const user = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      const from = location.state?.from;
      navigate(user.role === 'admin' ? '/admin' : (from || '/'), { replace: true });
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not sign you in.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fade-in flex min-h-[calc(100dvh-16rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="h-16 w-auto" />
          <h1 className="mt-5 text-2xl font-bold text-ink">Sign in to your account</h1>
          <p className="mt-1.5 text-sm text-muted">Track orders and check out faster.</p>
        </div>

        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {formError && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{formError}</div>
            )}
            <Field label="Email" htmlFor="email" error={errors.email}>
              <input id="email" type="email" autoComplete="email" className="input" aria-invalid={Boolean(errors.email)}
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Password" htmlFor="password" error={errors.password}>
              <div className="relative">
                <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="input pr-11" aria-invalid={Boolean(errors.password)}
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:text-ink" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>
            <button type="submit" disabled={busy} className="btn-primary w-full py-3">
              <LogIn className="size-4" /> {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

        </div>

        <p className="mt-6 text-center text-sm text-muted">
          New here? <Link to="/register" className="font-semibold text-tt-700 hover:text-tt-900">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
