import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { mediaApi } from "../api/media.api";
import { Media } from "../types/media.types";
import { UserLayout } from "../components/layout/UserLayout";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { ApiError } from "../api/client";

function IconFullscreen() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2" />
    </svg>
  );
}

function IconExitFullscreen() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M6 18L4 20m0 0l-2-2m2 2V16m0 4h4M18 6l2-2m0 0l2 2m-2-2v4m0-4h-4M6 6l-2-2m0 0l2-2m-2 2h4m-4 0v4M18 18l2 2m0 0l-2 2m2-2h-4m4 0v-4" />
    </svg>
  );
}

export function VideoPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Media | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

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

  // Track fullscreen state
  useEffect(() => {
    function onFSChange() {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener("fullscreenchange", onFSChange);
    return () => document.removeEventListener("fullscreenchange", onFSChange);
  }, []);

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  }

  const overlayBarClass = [
    "absolute bottom-0 left-0 right-0 z-10",
    "flex items-center justify-end px-4 py-2.5",
    "transition-opacity duration-200",
    isFullscreen
      ? "bg-black/60 opacity-0 group-hover:opacity-100"
      : "bg-slate-800/80",
  ].join(" ");

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

          <div
            ref={containerRef}
            className="relative bg-black group"
            style={{ aspectRatio: "16/9" }}
          >
            <video
              style={{ position: "absolute", width: "100%", height: "100%" }}
              controls
              controlsList="nofullscreen"
              autoPlay
              src={mediaApi.streamUrl(video.id)}
            />

            <div className={overlayBarClass}>
              <button
                onClick={toggleFullscreen}
                className="text-slate-300 hover:text-white transition-colors"
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <IconExitFullscreen /> : <IconFullscreen />}
              </button>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  );
}
