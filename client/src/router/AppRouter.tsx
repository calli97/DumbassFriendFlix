import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthPage } from '../pages/AuthPage';
import { ProfilePage } from '../pages/ProfilePage';
import { UsersPage } from '../pages/UsersPage';
import { MediaPage } from '../pages/MediaPage';
import { VideoListPage } from '../pages/VideoListPage';
import { VideoPlayerPage } from '../pages/VideoPlayerPage';
import { RequestsPage } from '../pages/RequestsPage';

function RootRedirect() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <AuthPage />;

  const isAdmin = user?.roles.some((r) => r.name === 'ADMIN') ?? false;
  return <Navigate to={isAdmin ? '/users' : '/videos'} replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        {/* Any authenticated user */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/videos" element={<VideoListPage />} />
          <Route path="/videos/:id" element={<VideoPlayerPage />} />
          <Route path="/requests" element={<RequestsPage />} />
        </Route>

        {/* Admin-only */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/users" element={<UsersPage />} />
          <Route path="/media" element={<MediaPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
