import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mediaApi } from '../api/media.api';
import { Media } from '../types/media.types';
import { AdminLayout } from '../components/layout/AdminLayout';
import { MediaUploadModal } from '../components/media/MediaUploadModal';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { ApiError } from '../api/client';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Media | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    mediaApi
      .findAllAdmin()
      .then(setItems)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load media');
      })
      .finally(() => setLoading(false));
  }, []);

  function handleUploadSuccess(media: Media) {
    setItems((prev) => [media, ...prev]);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await mediaApi.remove(deleteTarget.id);
      setItems((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
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
            {loading ? '—' : `${items.length} video${items.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          + Upload Video
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

      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 00-2.25-2.25h-9c-.621 0-1.184.252-1.591.659m12.182 12.182L2.909 5.909" />
          </svg>
          <p className="text-sm">No videos uploaded yet.</p>
          <Button size="sm" variant="secondary" onClick={() => setModalOpen(true)}>
            Upload your first video
          </Button>
        </div>
      )}

      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                {['#', 'Title', 'File', 'Type', 'Uploaded', 'Actions'].map((h) => (
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
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-900">
                    {item.title}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 max-w-xs truncate">
                    {item.originalName}
                  </td>
                  <td className="px-5 py-3.5">
                    <ExtBadge mimeType={item.mimeType} />
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/videos/${item.id}`)}
                      >
                        View
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
      )}

      <MediaUploadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

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
