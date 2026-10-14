import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { HOME_BY_ROLE } from '@/lib/format';
import FullPageLoader from '@/components/FullPageLoader';

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth(); // lấy từ GET /api/auth/me
  const location = useLocation();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={HOME_BY_ROLE[user.role] || '/'} replace />;
  return <Outlet />;
}
