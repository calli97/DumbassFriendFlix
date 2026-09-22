import { useEffect, useState } from 'react';
import { usersApi } from '../api/users.api';
import { User } from '../types/auth.types';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { AdminLayout } from '../components/layout/AdminLayout';
import { UserFormModal } from '../components/users/UserFormModal';
import { Modal } from '../components/ui/Modal';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

function RoleBadge({ name }: { name: string }) {
  const isAdmin = name === 'ADMIN';
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600',
      ].join(' ')}
    >
      {name}
    </span>
  );
}

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    usersApi
      .findAll()
      .then(setUsers)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load users');
      })
      .finally(() => setLoading(false));
  }, []);

  function openCreateModal() {
    setEditingUser(undefined);
    setModalOpen(true);
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setModalOpen(true);
  }

  function handleModalSuccess(saved: User) {
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === saved.id);
      return exists ? prev.map((u) => (u.id === saved.id ? saved : u)) : [saved, ...prev];
    });
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await usersApi.remove(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminLayout>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? '—' : `${users.length} registered user${users.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button onClick={openCreateModal} size="sm">
          + New User
        </Button>
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
        <div className="text-center py-20 text-slate-400 text-sm">No users found.</div>
      )}

      {users.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full min-w-[48rem] table-fixed divide-y divide-slate-100">
            <colgroup>
              <col className="w-[22%]" />
              <col />
              <col className="w-36" />
              <col className="w-36" />
              <col className="w-44" />
            </colgroup>
            <thead className="bg-slate-50">
              <tr>
                {['Username', 'Email', 'Roles', 'Member since', ''].map((h) => (
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
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-900 break-words">{u.username}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 break-words">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <RoleBadge key={r.id} name={r.name} />
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => openEditModal(u)}>
                        Edit
                      </Button>
                      {u.id !== currentUser?.id && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => { setDeleteTarget(u); setDeleteError(''); }}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UserFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        user={editingUser}
        onSuccess={handleModalSuccess}
      />

      {/* Delete modal */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete User"
        maxWidth="max-w-sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-600 break-words">
            Are you sure you want to delete{' '}
            <span className="font-medium text-slate-900">"{deleteTarget?.username}"</span>?
            They will no longer be able to log in and will stop appearing across the app.
          </p>

          {deleteError && (
            <p className="text-xs text-red-500">{deleteError}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deleting}
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
