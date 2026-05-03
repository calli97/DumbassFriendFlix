import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardBody } from '../components/ui/Card';
import { ApiError } from '../api/client';
import { authApi } from '../api/auth.api';

export function AuthPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { access_token, user } = await authApi.login({
        username: loginUsername,
        password: loginPassword,
      });

      login(access_token, user);

      const savedPath = sessionStorage.getItem('redirect_after_login');
      if (savedPath) {
        sessionStorage.removeItem('redirect_after_login');
        navigate(savedPath, { replace: true });
      } else {
        const isAdmin = user.roles.some((r) => r.name === 'ADMIN');
        navigate(isAdmin ? '/users' : '/videos', { replace: true });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <img src="/img/Magios.png" alt="Magiosflix" className="h-20 mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-indigo-600 tracking-tight">
            Magiosflix
          </h1>
          <p className="text-slate-500 text-sm mt-1">El Streaming de los Magios</p>
        </div>

        <Card>
          <CardBody>
            {/* Error banner */}
            {error && (
              <div className="mb-4 px-3 py-2.5 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <Input
                label="Username"
                type="text"
                placeholder="johndoe"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
                autoComplete="username"
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <Button type="submit" fullWidth loading={loading} className="mt-2">
                Sign In
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
