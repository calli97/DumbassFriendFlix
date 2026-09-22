import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mediaApi } from '../api/media.api';
import { Media } from '../types/media.types';
import { UserLayout } from '../components/layout/UserLayout';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Pagination } from '../components/ui/Pagination';
import { MediaFiltersBar } from '../components/media/MediaFiltersBar';
import { ApiError } from '../api/client';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useUserOptions } from '../hooks/useUserOptions';

const LIMIT = 10;

export function VideoListPage() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Media[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [name, setName] = useState('');
  const [recommendedById, setRecommendedById] = useState('');
  const debouncedName = useDebouncedValue(name);
  const users = useUserOptions();

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');
    mediaApi
      .findAll(page, {
        name: debouncedName,
        recommendedById: recommendedById ? Number(recommendedById) : undefined,
      })
      .then((res) => {
        if (ignore) return;
        setVideos(res.data);
        setTotal(res.total);
      })
      .catch((err) => {
        if (ignore) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load videos');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [page, debouncedName, recommendedById]);

  return (
    <UserLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Videos</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {loading ? '—' : `${total} video${total !== 1 ? 's' : ''}`}
        </p>
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

      {!loading && !error && videos.length === 0 && (
        <p className="text-slate-500 text-sm">No videos found.</p>
      )}

      {!loading && videos.length > 0 && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col />
                <col className="w-24" />
                <col className="w-32" />
                <col className="w-28" />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">IMDB</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Uploaded</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {videos.map((video) => (
                  <tr
                    key={video.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800 break-words">
                      {video.title}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {video.imdbLink ? (
                        <a
                          href={video.imdbLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          IMDB ↗
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(video.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/videos/${video.id}`)}
                      >
                        ▶ Play
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </UserLayout>
  );
}
