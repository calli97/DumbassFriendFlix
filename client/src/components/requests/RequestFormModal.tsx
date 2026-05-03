import { FormEvent, useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { requestsApi } from '../../api/requests.api';
import { usersApi } from '../../api/users.api';
import { mediaApi } from '../../api/media.api';
import { RequestItem, RequestStatus } from '../../types/request.types';
import { User } from '../../types/auth.types';
import { Media } from '../../types/media.types';
import { ApiError } from '../../api/client';

const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Complete', label: 'Complete' },
];

interface RequestFormModalProps {
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
  request?: RequestItem;
  onSuccess: (request: RequestItem) => void;
}

export function RequestFormModal({ open, onClose, isAdmin, request, onSuccess }: RequestFormModalProps) {
  const isEdit = Boolean(request);

  const [name, setName] = useState('');
  const [status, setStatus] = useState<RequestStatus>('Pending');
  const [comment, setComment] = useState('');
  const [recommendedById, setRecommendedById] = useState<string>('');
  const [mediaId, setMediaId] = useState<string>('');

  const [users, setUsers] = useState<User[]>([]);
  const [medias, setMedias] = useState<Media[]>([]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (request) {
      setName(request.name);
      setStatus(request.status);
      setComment(request.comment ?? '');
      setRecommendedById(request.recommendedBy ? String(request.recommendedBy.id) : '');
      setMediaId(request.mediaLinked ? String(request.mediaLinked.id) : '');
    } else {
      setName('');
      setStatus('Pending');
      setComment('');
      setRecommendedById('');
      setMediaId('');
    }
    setError('');
  }, [open, request]);

  useEffect(() => {
    if (!open || !isAdmin) return;

    usersApi.findAll().then(setUsers).catch(() => {});
    mediaApi.findAllAdmin().then(setMedias).catch(() => {});
  }, [open, isAdmin]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let saved: RequestItem;

      if (isEdit && request) {
        saved = await requestsApi.update(request.id, {
          name,
          status,
          comment: comment || null,
          recommendedById: recommendedById ? Number(recommendedById) : null,
          mediaId: mediaId ? Number(mediaId) : null,
        });
      } else if (isAdmin) {
        saved = await requestsApi.createAsAdmin({
          name,
          status,
          comment: comment || undefined,
          recommendedById: recommendedById ? Number(recommendedById) : undefined,
          mediaId: mediaId ? Number(mediaId) : undefined,
        });
      } else {
        saved = await requestsApi.create({
          name,
          comment: comment || undefined,
        });
      }

      onSuccess(saved);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const userOptions = [
    { value: '', label: '— None —' },
    ...users.map((u) => ({ value: String(u.id), label: u.username })),
  ];

  const mediaOptions = [
    { value: '', label: '— None —' },
    ...medias.map((m) => ({ value: String(m.id), label: m.title })),
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Request' : 'New Request'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="px-3 py-2.5 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Movie or series title"
        />

        {isAdmin && (
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(v) => setStatus(v as RequestStatus)}
          />
        )}

        <Input
          label="Comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional note…"
        />

        {isAdmin && (
          <>
            <Select
              label="Recommended by (optional)"
              options={userOptions}
              value={recommendedById}
              onChange={setRecommendedById}
            />

            <Select
              label="Linked media (optional)"
              options={mediaOptions}
              value={mediaId}
              onChange={setMediaId}
            />
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {isEdit ? 'Save Changes' : 'Create Request'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
