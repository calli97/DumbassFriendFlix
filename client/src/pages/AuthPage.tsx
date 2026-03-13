import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { ApiError } from '../api/client';

type Tab = 'login' | 'register';

export function AuthPage() {
  const [tab, setTab] = useState<Tab>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  function switchTab(next: Tab) {
    setTab(next);
    setError('');
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { access_token, user } = await authApi.login({
        email: loginEmail,
        password: loginPassword,
      });

      login(access_token, user);

      const isAdmin = user.roles.some((r) => r.name === 'ADMIN');
      navigate(isAdmin ? '/users' : '/profile', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.register({
        username: regUsername,
        email: regEmail,
        password: regPassword,
      });
      // After successful registration, switch to login and pre-fill email
      setLoginEmail(regEmail);
      setLoginPassword('');
      switchTab('login');
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
          <h1 className="text-3xl font-bold text-indigo-600 tracking-tight">
            DumbassFriendFlix
          </h1>
          <p className="text-slate-500 text-sm mt-1">Watch together, always.</p>
        </div>

        <Card>
          {/* Tab switcher */}
          <CardHeader className="p-0">
            <div className="flex">
              {(['login', 'register'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => switchTab(t)}
                  className={[
                    'flex-1 py-3.5 text-sm font-medium transition-colors duration-150 capitalize',
                    tab === t
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent',
                  ].join(' ')}
                >
                  {t === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardBody>
            {/* Error banner */}
            {error && (
              <div className="mb-4 px-3 py-2.5 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}

            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  autoComplete="email"
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
            ) : (
              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <Input
                  label="Username"
                  type="text"
                  placeholder="johndoe"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  helperText="Minimum 8 characters"
                />
                <Button type="submit" fullWidth loading={loading} className="mt-2">
                  Create Account
                </Button>
              </form>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
