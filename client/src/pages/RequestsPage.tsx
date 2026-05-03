import { useEffect, useState } from 'react';
import { requestsApi } from '../api/requests.api';
import { RequestItem } from '../types/request.types';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { AdminLayout } from '../components/layout/AdminLayout';
import { UserLayout } from '../components/layout/UserLayout';
import { RequestFormModal } from '../components/requests/RequestFormModal';
import { ApiError } from '../api/client';

const LIMIT = 10;

function StatusBadge({ status }: { status: string }) {
  const isPending = status === 'Pending';
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        isPending ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700',
      ].join(' ')}
    >
      {status}
    </span>
  );
}

export function RequestsPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles.some((r) => r.name === 'ADMIN') ?? false;

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<RequestItem | undefined>(undefined);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  useEffect(() => {
    setLoading(true);
    setError('');
    requestsApi
      .findAll(page)
      .then((res) => {
        setRequests(res.data);
        setTotal(res.total);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load requests');
      })
      .finally(() => setLoading(false));
  }, [page]);

  function openCreateModal() {
    setEditingRequest(undefined);
    setModalOpen(true);
  }

  function openEditModal(req: RequestItem) {
    setEditingRequest(req);
    setModalOpen(true);
  }

  function handleModalSuccess(saved: RequestItem) {
    setRequests((prev) => {
      const exists = prev.some((r) => r.id === saved.id);
      return exists ? prev.map((r) => (r.id === saved.id ? saved : r)) : [saved, ...prev];
    });
    if (!editingRequest) setTotal((t) => t + 1);
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this request?')) return;
    try {
      await requestsApi.remove(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setTotal((t) => t - 1);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to delete request');
    }
  }

  const content = (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Requests</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? '—' : `${total} request${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button onClick={openCreateModal} size="sm">
          + New Request
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

      {!loading && !error && requests.length === 0 && (
        <div className="text-center py-20 text-slate-400 text-sm">No requests found.</div>
      )}

      {requests.length > 0 && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  {['Name', 'Status', 'Recommended by', 'Linked media', 'Comment', 'Date', ...(isAdmin ? [''] : [])].map((h) => (
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
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-900">{req.name}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">
                      {req.recommendedBy?.username ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">
                      {req.mediaLinked?.title ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 max-w-xs truncate">
                      {req.comment ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                      {new Date(req.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" size="sm" onClick={() => openEditModal(req)}>
                            Edit
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleDelete(req.id)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <RequestFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        isAdmin={isAdmin}
        request={editingRequest}
        onSuccess={handleModalSuccess}
      />
    </>
  );

  return isAdmin ? (
    <AdminLayout>{content}</AdminLayout>
  ) : (
    <UserLayout>{content}</UserLayout>
  );
}
