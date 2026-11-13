import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, ShoppingCart, UserRound, X } from 'lucide-react';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const linkCls = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-tt-50 text-tt-700' : 'text-slate-600 hover:bg-slate-100 hover:text-ink'}`;

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Close the mobile menu whenever the page changes.
  useEffect(() => setOpen(false), [location.pathname]);

  const handleLogout = () => {
    logout();
    toast.info('You have been logged out');
    navigate('/');
  };

  const customerLinks = [
    { to: '/', label: 'Home', end: true },
    { to: '/shop', label: 'Shop' },
    { to: '/about', label: 'About' },
    ...(user ? [{ to: '/orders', label: 'My orders' }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-tt-100/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to={isAdmin ? '/admin' : '/'} className="flex shrink-0 items-center py-2" aria-label="Tunisie Telecom home">
          <Logo className="h-11 w-auto" />
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {isAdmin ? (
            <NavLink to="/admin" className={linkCls}>Administration</NavLink>
          ) : customerLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkCls}>{link.label}</NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!isAdmin && (
            <Link
              to="/cart"
              className="relative rounded-xl p-2.5 text-slate-700 transition hover:bg-tt-50 hover:text-tt-700"
              aria-label={`Shopping cart, ${count} item${count === 1 ? '' : 's'}`}
            >
              <ShoppingCart className="size-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-sun px-1.5 text-[11px] font-bold text-ink ring-2 ring-white">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <span className="flex items-center gap-2 rounded-full bg-tt-50 py-1.5 pl-2 pr-3 text-sm font-medium text-tt-800">
                <span className="flex size-7 items-center justify-center rounded-full bg-tt-700 text-xs font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-32 truncate">{user.name}</span>
              </span>
              {isAdmin && <LayoutDashboard className="size-4 text-tt-600" aria-hidden />}
              <button type="button" onClick={handleLogout} className="btn-ghost btn-sm" aria-label="Log out">
                <LogOut className="size-4" /> Log out
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/login" className="btn-ghost btn-sm"><UserRound className="size-4" /> Sign in</Link>
              <Link to="/register" className="btn-primary btn-sm">Create account</Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-xl p-2.5 text-slate-700 hover:bg-slate-100 md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="fade-in border-t border-slate-100 bg-white px-4 pb-5 pt-3 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {isAdmin ? (
              <NavLink to="/admin" className={linkCls}>Administration</NavLink>
            ) : customerLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={linkCls}>{link.label}</NavLink>
            ))}
          </nav>
          <div className="mt-4 border-t border-slate-100 pt-4">
            {user ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">Signed in as <span className="font-semibold text-ink">{user.name}</span></p>
                <button type="button" onClick={handleLogout} className="btn-secondary btn-sm"><LogOut className="size-4" /> Log out</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" className="btn-secondary">Sign in</Link>
                <Link to="/register" className="btn-primary">Create account</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
