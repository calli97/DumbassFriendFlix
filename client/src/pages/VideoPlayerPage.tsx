import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { mediaApi } from "../api/media.api";
import { Media } from "../types/media.types";
import { UserLayout } from "../components/layout/UserLayout";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { ApiError } from "../api/client";

export function VideoPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Media | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    mediaApi
      .findOne(Number(id))
      .then(setVideo)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load video");
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <UserLayout>
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/videos")}>
          ← Back to Videos
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

      {video && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h1 className="text-xl font-bold text-slate-900">{video.title}</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {video.mimeType} &middot;{" "}
              {new Date(video.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="bg-black" style={{ aspectRatio: "16/9" }}>
            <video
              style={{ width: "100%", height: "100%" }}
              controls
              autoPlay
              src={mediaApi.streamUrl(video.id)}
            />
          </div>
        </div>
      )}
    </UserLayout>
  );
}
