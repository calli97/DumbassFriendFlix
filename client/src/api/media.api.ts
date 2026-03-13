import { apiClient, ApiError } from './client';
import { Media } from '../types/media.types';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

// File uploads require multipart/form-data — cannot use the JSON apiClient
async function uploadRequest(formData: FormData): Promise<Media> {
  const token = localStorage.getItem('access_token');

  const response = await fetch(`${API_BASE}/media/upload`, {
    method: 'POST',
    headers: {
      // Do NOT set Content-Type here — the browser must set it with the multipart boundary
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new ApiError(response.status, body.message ?? 'Upload failed');
  }

  return response.json() as Promise<Media>;
}

export const mediaApi = {
  upload: (title: string, file: File): Promise<Media> => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);
    return uploadRequest(formData);
  },

  findAll: (): Promise<Media[]> =>
    apiClient.get<Media[]>('/media'),
};
