import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mediaApi } from '../api/media.api';
import { Media } from '../types/media.types';
import { UserLayout } from '../components/layout/UserLayout';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { ApiError } from '../api/client';

function MimeBadge({ mimeType }: { mimeType: string }) {
  const ext = mimeType.split('/')[1]?.toUpperCase() ?? mimeType;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
      {ext}
    </span>
  );
}

export function VideoListPage() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    mediaApi
      .findAll()
      .then(setVideos)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load videos');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <UserLayout>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Videos</h1>

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
        <p className="text-slate-500 text-sm">No videos available yet.</p>
      )}

      {videos.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500">Title</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Type</th>
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
                  <td className="px-4 py-3 font-medium text-slate-800">{video.title}</td>
                  <td className="px-4 py-3">
                    <MimeBadge mimeType={video.mimeType} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(video.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
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
      )}
    </UserLayout>
  );
}
