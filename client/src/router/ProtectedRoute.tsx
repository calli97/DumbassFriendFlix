import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RoleName } from '../types/auth.types';

interface ProtectedRouteProps {
  // If provided, the user must have at least one of these roles
  allowedRoles?: RoleName[];
  // Where to redirect unauthenticated users (default: '/')
  redirectTo?: string;
}

export function ProtectedRoute({
  allowedRoles,
  redirectTo = '/',
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    sessionStorage.setItem('redirect_after_login', location.pathname + location.search);
    return <Navigate to={redirectTo} replace />;
  }

  if (allowedRoles && user) {
    const userRoleNames = user.roles.map((r) => r.name);
    const hasRole = allowedRoles.some((r) => userRoleNames.includes(r));
    if (!hasRole) return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
