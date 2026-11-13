import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ClipboardList, LayoutDashboard, LogOut, Package } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info('You have been logged out');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-dvh bg-tt-50/60 lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-tt-100 bg-white lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <div className="border-b border-slate-100 px-6 py-5">
          <Logo className="h-10 w-auto" />
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-tt-600">Administration</p>
        </div>
        <nav className="flex-1 space-y-1 p-4" aria-label="Admin">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${isActive ? 'bg-tt-700 text-white shadow-sm' : 'text-slate-600 hover:bg-tt-50 hover:text-tt-800'}`
              }
            >
              <Icon className="size-4.5" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <p className="truncate px-2 text-sm font-semibold text-ink">{user?.name}</p>
          <p className="truncate px-2 text-xs text-muted">{user?.email}</p>
          <button type="button" onClick={handleLogout} className="btn-secondary mt-3 w-full"><LogOut className="size-4" /> Log out</button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile / tablet header with tabs */}
        <div className="sticky top-0 z-30 border-b border-tt-100 bg-white/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Logo className="h-9 w-auto" />
              <span className="text-sm font-semibold text-tt-700">Admin</span>
            </div>
            <button type="button" onClick={handleLogout} className="btn-ghost btn-sm" aria-label="Log out"><LogOut className="size-4" /></button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2" aria-label="Admin sections">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-tt-700 text-white' : 'text-slate-600 hover:bg-tt-50'}`
                }
              >
                <Icon className="size-4" /> {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
