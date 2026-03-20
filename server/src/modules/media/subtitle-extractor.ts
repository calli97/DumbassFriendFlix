import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execFileAsync = promisify(execFile);

// Allow overriding binary paths via env vars (useful if not on PATH)
const FFPROBE = process.env.FFPROBE_PATH ?? 'ffprobe';
const FFMPEG = process.env.FFMPEG_PATH ?? 'ffmpeg';

export interface SubtitleTrack {
  index: number;    // 0-based subtitle stream index used for extraction and endpoint
  language: string; // ISO 639-2 code ('eng', 'spa', 'und', …)
  label: string;    // human-readable name shown in the player CC menu
  vttPath: string;  // absolute path to the extracted .vtt file on disk
}

async function probeSubtitleStreams(
  filePath: string,
): Promise<Array<{ streamIndex: number; language: string; label: string }>> {
  const { stdout } = await execFileAsync(FFPROBE, [
    '-v', 'quiet',
    '-print_format', 'json',
    '-show_streams',
    '-select_streams', 's',
    filePath,
  ]);

  const streams: any[] = JSON.parse(stdout).streams ?? [];

  return streams.map((s, i) => ({
    streamIndex: i,
    language: s.tags?.language ?? 'und',
    label: s.tags?.title ?? s.tags?.language ?? `Track ${i + 1}`,
  }));
}

async function extractToVtt(filePath: string, subtitleStreamIndex: number, outPath: string): Promise<void> {
  await execFileAsync(FFMPEG, [
    '-i', filePath,
    '-map', `0:s:${subtitleStreamIndex}`,
    '-f', 'webvtt',
    '-y',
    outPath,
  ]);
}

/**
 * Probes the video file for subtitle streams, extracts each one as a WebVTT file,
 * and returns the list of successfully extracted tracks.
 * Failures on individual streams are logged and skipped — never crash the upload.
 */
export async function extractAllSubtitles(
  filePath: string,
  storePath: string,
  uploadId: string,
): Promise<SubtitleTrack[]> {
  let streams: Awaited<ReturnType<typeof probeSubtitleStreams>>;

  try {
    streams = await probeSubtitleStreams(filePath);
  } catch (err) {
    console.warn('[Subtitles] ffprobe failed — skipping subtitle extraction:', (err as Error).message);
    return [];
  }

  if (streams.length === 0) return [];

  const tracks: SubtitleTrack[] = [];

  for (const stream of streams) {
    const vttPath = path.join(storePath, `${uploadId}.${stream.streamIndex}.vtt`);
    try {
      await extractToVtt(filePath, stream.streamIndex, vttPath);
      tracks.push({ index: stream.streamIndex, language: stream.language, label: stream.label, vttPath });
    } catch (err) {
      console.warn(`[Subtitles] Failed to extract stream ${stream.streamIndex}:`, (err as Error).message);
    }
  }

  console.log(`[Subtitles] Extracted ${tracks.length}/${streams.length} tracks for upload ${uploadId}`);
  return tracks;
}
