import { apiClient, ApiError } from './client';
import { Media } from '../types/media.types';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

export type UploadProgressCallback = (loaded: number, total: number) => void;

// File uploads require multipart/form-data — XMLHttpRequest is used for progress tracking
function uploadRequest(formData: FormData, onProgress?: UploadProgressCallback): Promise<Media> {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('access_token');
    const xhr = new XMLHttpRequest();

    xhr.open('POST', `${API_BASE}/media/upload`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded, e.total);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as Media);
      } else {
        const body = JSON.parse(xhr.responseText || '{}');
        reject(new ApiError(xhr.status, body.message ?? 'Upload failed'));
      }
    };

    xhr.onerror = () => reject(new ApiError(0, 'Upload failed'));

    xhr.send(formData);
  });
}

export const mediaApi = {
  upload: (title: string, file: File, onProgress?: UploadProgressCallback): Promise<Media> => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);
    return uploadRequest(formData, onProgress);
  },

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
