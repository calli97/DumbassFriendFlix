import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mediaApi } from '../api/media.api';
import { Media } from '../types/media.types';
import { AdminLayout } from '../components/layout/AdminLayout';
import { MediaUploadModal } from '../components/media/MediaUploadModal';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Pagination } from '../components/ui/Pagination';
import { MediaFiltersBar } from '../components/media/MediaFiltersBar';
import { ApiError } from '../api/client';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useUserOptions } from '../hooks/useUserOptions';

const LIMIT = 10;

function ExtBadge({ mimeType }: { mimeType: string }) {
  const label = mimeType.split('/').pop()?.toUpperCase() ?? 'VIDEO';
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
      {label}
    </span>
  );
}

export function MediaPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Media[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Filters
  const [name, setName] = useState('');
  const [recommendedById, setRecommendedById] = useState('');
  const debouncedName = useDebouncedValue(name);
  const users = useUserOptions();

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Media | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Edit
  const [editTarget, setEditTarget] = useState<Media | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editImdbLink, setEditImdbLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');
    mediaApi
      .findAllAdmin(page, {
        name: debouncedName,
        recommendedById: recommendedById ? Number(recommendedById) : undefined,
      })
      .then((res) => {
        if (ignore) return;
        // Deleting the last item of the last page leaves it empty: step back one page
        if (res.data.length === 0 && page > 1) {
          setPage((p) => p - 1);
          return;
        }
        setItems(res.data);
        setTotal(res.total);
      })
      .catch((err) => {
        if (ignore) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load media');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [page, debouncedName, recommendedById, reloadKey]);

  function reload() {
    setReloadKey((k) => k + 1);
  }

  function openEdit(item: Media) {
    setEditTarget(item);
    setEditTitle(item.title);
    setEditImdbLink(item.imdbLink ?? '');
    setSaveError('');
  }

  async function handleEditSave() {
    if (!editTarget) return;
    setSaving(true);
    setSaveError('');
    try {
      const updated = await mediaApi.update(editTarget.id, {
        title: editTitle.trim() || undefined,
        imdbLink: editImdbLink.trim() || null,
      });
      setItems((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditTarget(null);
      reload();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await mediaApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      reload();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Failed to delete video');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminLayout>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Media</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? '—' : `${total} video${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          + Upload Video
        </Button>
      </div>

      <MediaFiltersBar
        name={name}
        onNameChange={(v) => { setName(v); setPage(1); }}
        recommendedById={recommendedById}
        onRecommendedByChange={(v) => { setRecommendedById(v); setPage(1); }}
        users={users}
      />

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

      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 00-2.25-2.25h-9c-.621 0-1.184.252-1.591.659m12.182 12.182L2.909 5.909" />
          </svg>
          <p className="text-sm">No videos found.</p>
          <Button size="sm" variant="secondary" onClick={() => setModalOpen(true)}>
            Upload your first video
          </Button>
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full table-fixed divide-y divide-slate-100">
              <colgroup>
                <col className="w-16" />
                <col />
                <col className="w-36" />
                <col className="w-56" />
              </colgroup>
              <thead className="bg-slate-50">
                <tr>
                  {['#', 'Title', 'Uploaded', 'Actions'].map((h) => (
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
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-slate-400 tabular-nums">
                      {item.id}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-900 break-words">
                      <p className="font-medium">{item.title}</p>
                      {item.imdbLink && (
                        <a
                          href={item.imdbLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          IMDB ↗
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => navigate(`/videos/${item.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openEdit(item)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => { setDeleteTarget(item); setDeleteError(''); }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <MediaUploadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={reload}
      />

      {/* Edit modal */}
      <Modal
        open={editTarget !== null}
        onClose={() => !saving && setEditTarget(null)}
        title="Edit Video"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">IMDB Link</label>
            <input
              value={editImdbLink}
              onChange={(e) => setEditImdbLink(e.target.value)}
              placeholder="https://www.imdb.com/title/..."
              className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {saveError && (
            <p className="text-xs text-red-500">{saveError}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditTarget(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              loading={saving}
              onClick={handleEditSave}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete Video"
        maxWidth="max-w-sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete{' '}
            <span className="font-medium text-slate-900">"{deleteTarget?.title}"</span>?
            This will permanently remove the video file and cannot be undone.
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
