import { RefObject, useEffect } from 'react';

/** Only videos longer than this (seconds) get their progress saved */
const MIN_DURATION = 300;
const SAVE_INTERVAL_MS = 10_000;
/** Resume this many seconds before the saved position */
const REWIND = 10;

function storageKey(userId: number, mediaId: number): string {
  return `video_progress:${userId}:${mediaId}`;
}

function readProgress(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    const value = raw === null ? NaN : Number(raw);
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeProgress(key: string, seconds: number): void {
  try {
    localStorage.setItem(key, String(Math.floor(seconds)));
  } catch {
    // Storage unavailable or full: playback still works, progress just isn't kept
  }
}

function clearProgress(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Saves the playback position of long videos to localStorage every 10s
 * and resumes from it (minus a few seconds) when the video is opened again.
 * `src` is only used to re-attach once the <video> has its stream URL.
 */
export function useVideoProgress(
  videoRef: RefObject<HTMLVideoElement>,
  mediaId: number | undefined,
  userId: number | undefined,
  src: string | null,
): void {
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src || mediaId === undefined || userId === undefined) return;

    const key = storageKey(userId, mediaId);
    const isLong = () => Number.isFinite(video.duration) && video.duration > MIN_DURATION;

    function save() {
      if (!video || !isLong() || video.ended) return;
      if (video.currentTime > 0) writeProgress(key, video.currentTime);
    }

    function resume() {
      if (!video || !isLong()) return;
      const saved = readProgress(key);
      // Nothing saved, or it was basically finished: start from the beginning
      if (saved === null || saved >= video.duration - REWIND) return;
      video.currentTime = Math.max(0, saved - REWIND);
    }

    function handleEnded() {
      clearProgress(key);
    }

    // Metadata may already be loaded if the effect attaches late
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      resume();
    } else {
      video.addEventListener('loadedmetadata', resume, { once: true });
    }
    video.addEventListener('pause', save);
    video.addEventListener('ended', handleEnded);
    // Reloading/closing the tab doesn't unmount React, so save there too
    window.addEventListener('pagehide', save);

    const interval = setInterval(() => {
      if (!video.paused) save();
    }, SAVE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      save();
      video.removeEventListener('loadedmetadata', resume);
      video.removeEventListener('pause', save);
      video.removeEventListener('ended', handleEnded);
      window.removeEventListener('pagehide', save);
    };
  }, [videoRef, mediaId, userId, src]);
}
