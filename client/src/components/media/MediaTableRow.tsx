import { useEffect, useState } from 'react';
import { Media, ImdbMeta } from '../../types/media.types';
import { mediaApi } from '../../api/media.api';
import { Button } from '../ui/Button';

interface Props {
  item: Media;
  onEdit: (item: Media) => void;
  onDelete: (item: Media) => void;
  onView: (id: number) => void;
}

function ExtBadge({ mimeType }: { mimeType: string }) {
  const label = mimeType.split('/').pop()?.toUpperCase() ?? 'VIDEO';
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
      {label}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="flex gap-2 items-start animate-pulse">
      <div className="h-16 w-11 rounded bg-slate-200 shrink-0" />
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="h-2.5 rounded bg-slate-200 w-full" />
        <div className="h-2.5 rounded bg-slate-200 w-4/5" />
        <div className="h-2.5 rounded bg-slate-200 w-3/5" />
      </div>
    </div>
  );
}

export function MediaTableRow({ item, onEdit, onDelete, onView }: Props) {
  const [imdbMeta, setImdbMeta] = useState<ImdbMeta | null>(null);
  const [imdbLoading, setImdbLoading] = useState(false);

  useEffect(() => {
    if (!item.imdbLink) return;
    setImdbLoading(true);
    mediaApi
      .fetchImdbMeta(item.imdbLink)
      .then(setImdbMeta)
      .catch(() => setImdbMeta({ image: null, description: null }))
      .finally(() => setImdbLoading(false));
  }, [item.imdbLink]);

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-5 py-3.5 text-sm text-slate-400 tabular-nums">
        {item.id}
      </td>

      <td className="px-5 py-3.5 text-sm text-slate-900">
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

      <td className="px-5 py-3.5 text-sm text-slate-500 max-w-xs">
        {!item.imdbLink ? (
          <span className="text-slate-300">—</span>
        ) : imdbLoading ? (
          <Skeleton />
        ) : (
          <div className="flex gap-2 items-start">
            {imdbMeta?.image && (
              <img
                src={imdbMeta.image}
                alt={item.title}
                className="h-16 w-auto rounded object-cover shrink-0"
              />
            )}
            {imdbMeta?.description && (
              <p className="text-xs text-slate-500 line-clamp-3">{imdbMeta.description}</p>
            )}
            {!imdbMeta?.image && !imdbMeta?.description && (
              <span className="text-slate-300">—</span>
            )}
          </div>
        )}
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
          <Button size="sm" variant="secondary" onClick={() => onView(item.id)}>
            View
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onEdit(item)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => onDelete(item)}>
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}
