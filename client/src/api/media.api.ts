import * as tus from 'tus-js-client';
import { apiClient, ApiError } from './client';
import { Media } from '../types/media.types';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

export type UploadProgressCallback = (loaded: number, total: number) => void;

function tusUpload(title: string, file: File, onProgress?: UploadProgressCallback): Promise<Media> {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('access_token') ?? '';
    let capturedMediaId: number | null = null;

    const upload = new tus.Upload(file, {
      endpoint: `${API_BASE}/media/tus`,
      retryDelays: [0, 3_000, 5_000, 10_000, 20_000],
      chunkSize: 10 * 1024 * 1024, // 10 MB chunks
      metadata: {
        filename: file.name,
        filetype: file.type,
        title,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        onProgress?.(bytesUploaded, bytesTotal);
      },
      onAfterResponse: (_req, res) => {
        // The server sets X-Media-Id on the final PATCH response (onUploadFinish hook)
        const id = res.getHeader('X-Media-Id');
        if (id) capturedMediaId = parseInt(id, 10);
      },
      onSuccess: async () => {
        if (capturedMediaId === null) {
          reject(new ApiError(500, 'Upload succeeded but no media ID was returned'));
          return;
        }
        try {
          resolve(await apiClient.get<Media>(`/media/${capturedMediaId}`));
        } catch (err) {
          reject(err);
        }
      },
      onError: (err) => reject(new ApiError(0, err.message ?? 'Upload failed')),
    });

    upload.start();
  });
}

export const mediaApi = {
  upload: (title: string, file: File, onProgress?: UploadProgressCallback): Promise<Media> =>
    tusUpload(title, file, onProgress),

  findAll: (): Promise<Media[]> =>
    apiClient.get<Media[]>('/media/list'),

  findOne: (id: number): Promise<Media> =>
    apiClient.get<Media>(`/media/${id}`),

  /** Returns a URL with the JWT token as a query param for use in <video src="..."> */
  streamUrl: (id: number): string => {
    const token = localStorage.getItem('access_token') ?? '';
    return `${API_BASE}/media/${id}/stream?token=${encodeURIComponent(token)}`;
  },
};
