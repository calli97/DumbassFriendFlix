import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthPage } from '../pages/AuthPage';
import { ProfilePage } from '../pages/ProfilePage';
import { UsersPage } from '../pages/UsersPage';

function RootRedirect() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <AuthPage />;

  // Already logged in — send to the appropriate page based on role
  const isAdmin = user?.roles.some((r) => r.name === 'ADMIN') ?? false;
  return <Navigate to={isAdmin ? '/users' : '/profile'} replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        {/* Any authenticated user can see their profile */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Admin-only routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/users" element={<UsersPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
