import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Spinner from './Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/** Guards routes by login state and role. Admins and customers are sent to their own areas. */
export default function RequireAuth({ role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="py-32"><Spinner label="Checking your session…" /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  return <Outlet />;
}
