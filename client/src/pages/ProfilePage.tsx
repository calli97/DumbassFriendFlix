import { useEffect, useState } from 'react';
import { authApi } from '../api/auth.api';
import { User } from '../types/auth.types';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { ApiError } from '../api/client';
import { UserLayout } from '../components/layout/UserLayout';

function Avatar({ username }: { username: string }) {
  const initials = username.slice(0, 2).toUpperCase();
  return (
    <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xl font-bold select-none">
      {initials}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 border-b border-slate-100 last:border-0">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm text-slate-800">{value}</span>
    </div>
  );
}

export function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    authApi
      .me()
      .then(setUser)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load profile');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <UserLayout>
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

      {user && (
        <div className="max-w-lg">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar username={user.username} />
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {user.username}
                  </h2>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
              </div>
            </CardHeader>

            <CardBody className="py-2">
              <InfoRow label="User ID" value={String(user.id)} />
              <InfoRow
                label="Roles"
                value={user.roles.map((r) => r.name).join(', ')}
              />
              <InfoRow
                label="Member since"
                value={new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              />
              <InfoRow
                label="Last updated"
                value={new Date(user.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              />
            </CardBody>
          </Card>
        </div>
      )}
    </UserLayout>
  );
}
