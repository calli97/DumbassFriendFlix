import { useEffect, useState } from 'react';
import { requestsApi } from '../api/requests.api';
import { RequestItem, RequestStatus } from '../types/request.types';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Pagination } from '../components/ui/Pagination';
import { AdminLayout } from '../components/layout/AdminLayout';
import { UserLayout } from '../components/layout/UserLayout';
import { RequestFormModal } from '../components/requests/RequestFormModal';
import { ApiError } from '../api/client';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useUserOptions } from '../hooks/useUserOptions';

const LIMIT = 10;

const STATUS_FILTER_OPTIONS = [
  { value: '', label: '— All —' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Complete', label: 'Complete' },
];

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
  const [reloadKey, setReloadKey] = useState(0);

  // Filters
  const [name, setName] = useState('');
  const [recommendedById, setRecommendedById] = useState('');
  const [status, setStatus] = useState<RequestStatus | ''>('Pending');
  const debouncedName = useDebouncedValue(name);
  const users = useUserOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<RequestItem | undefined>(undefined);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');
    requestsApi
      .findAll(page, {
        name: debouncedName,
        status: status || undefined,
        recommendedById: recommendedById ? Number(recommendedById) : undefined,
      })
      .then((res) => {
        if (ignore) return;
        // Deleting the last item of the last page leaves it empty: step back one page
        if (res.data.length === 0 && page > 1) {
          setPage((p) => p - 1);
          return;
        }
        setRequests(res.data);
        setTotal(res.total);
      })
      .catch((err) => {
        if (ignore) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load requests');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [page, debouncedName, status, recommendedById, reloadKey]);

  function reload() {
    setReloadKey((k) => k + 1);
  }

  function openCreateModal() {
    setEditingRequest(undefined);
    setModalOpen(true);
  }

  function openEditModal(req: RequestItem) {
    setEditingRequest(req);
    setModalOpen(true);
  }

  function handleModalSuccess() {
    reload();
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this request?')) return;
    try {
      await requestsApi.remove(id);
      reload();
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => { setName(e.target.value); setPage(1); }}
          placeholder="Search by name…"
        />
        <Select
          label="Requested by"
          value={recommendedById}
          onChange={(v) => { setRecommendedById(v); setPage(1); }}
          options={[
            { value: '', label: '— All —' },
            ...users.map((u) => ({ value: String(u.id), label: u.username })),
          ]}
        />
        <Select
          label="Status"
          value={status}
          onChange={(v) => { setStatus(v as RequestStatus | ''); setPage(1); }}
          options={STATUS_FILTER_OPTIONS}
        />
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

      {!loading && requests.length > 0 && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full min-w-[56rem] table-fixed divide-y divide-slate-100">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-28" />
                <col className="w-36" />
                <col className="w-[16%]" />
                <col />
                <col className="w-32" />
                {isAdmin && <col className="w-40" />}
              </colgroup>
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
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors align-top">
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-900 break-words">{req.name}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 break-words">
                      {req.recommendedBy?.username ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 break-words">
                      {req.mediaLinked?.title ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 break-words whitespace-pre-wrap">
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
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap justify-end gap-2">
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

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
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
