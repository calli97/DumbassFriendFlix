import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ASS from "assjs";
import { mediaApi } from "../api/media.api";
import { Media, SubTrack } from "../types/media.types";
import { UserLayout } from "../components/layout/UserLayout";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { ApiError } from "../api/client";

function getExt(filePath: string): string {
  return filePath.split(".").pop()?.toLowerCase() ?? "";
}

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
  const [selectedTrack, setSelectedTrack] = useState<SubTrack | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const assRef = useRef<ASS | null>(null);

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

  // Init / teardown ASS renderer when selected track changes
  useEffect(() => {
    if (assRef.current) {
      assRef.current.destroy();
      assRef.current = null;
    }

    if (!selectedTrack || !video || !videoRef.current || !containerRef.current) return;
    if (getExt(selectedTrack.path) !== "ass") return;

    let cancelled = false;
    const url = mediaApi.subTrackUrl(video.id, selectedTrack.id);

    fetch(url)
      .then((r) => r.text())
      .then((content) => {
        if (cancelled || !videoRef.current || !containerRef.current) return;
        assRef.current = new ASS(content, videoRef.current, {
          container: containerRef.current,
        });
      })
      .catch(() => undefined);

    return () => { cancelled = true; };
  }, [selectedTrack, video]);

  // Clean up on unmount
  useEffect(() => {
    return () => { assRef.current?.destroy(); };
  }, []);

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  }

  function handleSelectTrack(track: SubTrack) {
    setSelectedTrack((prev) => (prev?.id === track.id ? null : track));
  }

  const isAssTrack = (track: SubTrack) => getExt(track.path) === "ass";

  const overlayBarClass = [
    "absolute bottom-0 left-0 right-0 z-10",
    "flex items-center gap-2 px-4 py-2.5 flex-wrap",
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

          {/*
           * Container is the fullscreen target.
           * The subtitle overlay (assjs) renders inside here so it stays
           * visible in fullscreen. Native video fullscreen is disabled so
           * the browser always fullscreens this container instead.
           */}
          <div
            ref={containerRef}
            className="relative bg-black group"
            style={{ aspectRatio: "16/9" }}
          >
            <video
              ref={videoRef}
              style={{ position: "absolute", width: "100%", height: "100%" }}
              controls
              // Hide native fullscreen button — we provide our own so the
              // subtitle overlay container is what gets fullscreened.
              controlsList="nofullscreen"
              autoPlay
              src={mediaApi.streamUrl(video.id)}
            >
              {/* Native <track> only for non-ASS subtracks */}
              {selectedTrack && !isAssTrack(selectedTrack) && (
                <track
                  key={selectedTrack.id}
                  kind="subtitles"
                  src={mediaApi.subTrackUrl(video.id, selectedTrack.id)}
                  default
                />
              )}
            </video>

            {/* Bottom bar: subtitle selector + fullscreen button.
                Always inside the container so it survives fullscreen. */}
            <div className={overlayBarClass}>
              <span className="text-xs font-medium text-slate-300 mr-1">
                Subtitles:
              </span>

              <button
                onClick={() => setSelectedTrack(null)}
                className={[
                  "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                  selectedTrack === null
                    ? "bg-indigo-500 text-white"
                    : "bg-white/10 text-slate-300 hover:bg-white/20",
                ].join(" ")}
              >
                Off
              </button>

              {video.subTracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => handleSelectTrack(track)}
                  className={[
                    "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                    selectedTrack?.id === track.id
                      ? "bg-indigo-500 text-white"
                      : "bg-white/10 text-slate-300 hover:bg-white/20",
                  ].join(" ")}
                >
                  {track.name}
                  {isAssTrack(track) && (
                    <span className="ml-1 opacity-50">.ass</span>
                  )}
                </button>
              ))}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Custom fullscreen toggle */}
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
