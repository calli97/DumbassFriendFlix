import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { mediaApi } from "../api/media.api";
import { Media } from "../types/media.types";
import { UserLayout } from "../components/layout/UserLayout";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function VideoPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.roles.some((r) => r.name === "ADMIN") ?? false;

  const [video, setVideo] = useState<Media | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editImdbLink, setEditImdbLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

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

  function startEditing() {
    if (!video) return;
    setEditTitle(video.title);
    setEditImdbLink(video.imdbLink ?? "");
    setSaveError("");
    setEditing(true);
    setTimeout(() => titleRef.current?.focus(), 0);
  }

  function cancelEditing() {
    setEditing(false);
    setSaveError("");
  }

  async function saveEdits() {
    if (!video) return;
    setSaving(true);
    setSaveError("");
    try {
      const updated = await mediaApi.update(video.id, {
        title: editTitle.trim() || undefined,
        imdbLink: editImdbLink.trim() || null,
      });
      setVideo(updated);
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

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
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                  <input
                    ref={titleRef}
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
                  <p className="text-xs text-red-600">{saveError}</p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEdits} disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={cancelEditing} disabled={saving}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{video.title}</h1>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {video.mimeType} &middot;{" "}
                    {new Date(video.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  {video.imdbLink && (
                    <a
                      href={video.imdbLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                    >
                      IMDB ↗
                    </a>
                  )}
                </div>
                {isAdmin && (
                  <Button variant="ghost" size="sm" onClick={startEditing}>
                    Edit
                  </Button>
                )}
              </div>
            )}
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
