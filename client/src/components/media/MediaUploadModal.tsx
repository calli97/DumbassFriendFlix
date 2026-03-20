import { FormEvent, useRef, useState, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { mediaApi } from '../../api/media.api';
import { Media } from '../../types/media.types';
import { ApiError } from '../../api/client';

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec <= 0) return '';
  if (bytesPerSec >= 1_048_576) return `${(bytesPerSec / 1_048_576).toFixed(1)} MB/s`;
  return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.ceil(seconds)}s remaining`;
  const m = Math.floor(seconds / 60);
  const s = Math.ceil(seconds % 60);
  return `${m}m ${s}s remaining`;
}

const ALLOWED_EXTENSIONS = ['.mp4', '.mkv', '.avi'];
const ALLOWED_ACCEPT = ALLOWED_EXTENSIONS.join(',');

interface MediaUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (media: Media) => void;
}

export function MediaUploadModal({ open, onClose, onSuccess }: MediaUploadModalProps) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastLoadedRef = useRef(0);
  const lastTimeRef = useRef(0);

  function reset() {
    setTitle('');
    setFile(null);
    setFileError('');
    setError('');
    setProgress(0);
    setSpeed(0);
    setTimeLeft(null);
    lastLoadedRef.current = 0;
    lastTimeRef.current = 0;
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const handleProgress = useCallback((loaded: number, total: number) => {
    const now = Date.now();
    setProgress(total > 0 ? Math.round((loaded / total) * 100) : 0);

    const elapsed = (now - lastTimeRef.current) / 1000;
    if (elapsed >= 0.3) {
      const currentSpeed = (loaded - lastLoadedRef.current) / elapsed;
      setSpeed(currentSpeed);
      if (currentSpeed > 0) setTimeLeft((total - loaded) / currentSpeed);
      lastLoadedRef.current = loaded;
      lastTimeRef.current = now;
    }
  }, []);

  function handleClose() {
    reset();
    onClose();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError('');
    const selected = e.target.files?.[0] ?? null;
    if (!selected) { setFile(null); return; }

    const ext = selected.name.substring(selected.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError(`Only ${ALLOWED_EXTENSIONS.join(', ')} files are allowed`);
      setFile(null);
      e.target.value = '';
      return;
    }

    setFile(selected);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!file) { setFileError('Please select a video file'); return; }

    setLoading(true);
    lastLoadedRef.current = 0;
    lastTimeRef.current = Date.now();
    try {
      const media = await mediaApi.upload(title.trim(), file, handleProgress);
      onSuccess(media);
      handleClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Upload Video">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="px-3 py-2.5 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My awesome video"
          required
          maxLength={255}
        />

        {/* File picker */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Video File</label>

          <label
            className={[
              'flex flex-col items-center justify-center gap-2 w-full rounded-md border-2 border-dashed px-4 py-8 cursor-pointer transition-colors duration-150',
              fileError
                ? 'border-red-300 bg-red-50'
                : file
                  ? 'border-indigo-400 bg-indigo-50'
                  : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50',
            ].join(' ')}
          >
            <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>

            {file ? (
              <span className="text-sm font-medium text-indigo-700">{file.name}</span>
            ) : (
              <span className="text-sm text-slate-500">
                Click to select or drag a file here
              </span>
            )}

            <span className="text-xs text-slate-400">{ALLOWED_EXTENSIONS.join(' · ')}</span>

            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_ACCEPT}
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>

          {fileError && (
            <p className="text-xs text-red-500" role="alert">{fileError}</p>
          )}
        </div>

        {loading && (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-slate-500">
              <span>{formatSpeed(speed)}</span>
              <span>{progress}%{timeLeft !== null ? ` · ${formatTime(timeLeft)}` : ''}</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Upload
          </Button>
        </div>
      </form>
    </Modal>
  );
}
