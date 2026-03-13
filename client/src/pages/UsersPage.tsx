import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../api/users.api';
import { useAuth } from '../context/AuthContext';
import { User } from '../types/auth.types';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { ApiError } from '../api/client';

function RoleBadge({ name }: { name: string }) {
  const isAdmin = name === 'ADMIN';
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        isAdmin
          ? 'bg-indigo-100 text-indigo-700'
          : 'bg-slate-100 text-slate-600',
      ].join(' ')}
    >
      {name}
    </span>
  );
}

export function UsersPage() {
  const { logout, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    usersApi
      .findAll()
      .then(setUsers)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load users');
      })
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-indigo-600">DumbassFriendFlix</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            {currentUser?.username}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Users</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {loading ? '—' : `${users.length} registered user${users.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && users.length === 0 && (
          <div className="text-center py-20 text-slate-400 text-sm">
            No users found.
          </div>
        )}

        {users.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  {['Username', 'Email', 'Roles', 'Member since'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-900">
                      {u.username}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">
                      {u.email}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <RoleBadge key={r.id} name={r.name} />
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
