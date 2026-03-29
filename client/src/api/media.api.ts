import * as tus from "tus-js-client";
import { apiClient, ApiError } from "./client";
import { Media, SubTrack } from "../types/media.types";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api/v1";

export type UploadProgressCallback = (loaded: number, total: number) => void;

function tusUpload(
  title: string,
  file: File,
  onProgress?: UploadProgressCallback,
): Promise<Media> {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem("access_token") ?? "";
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
        const id = res.getHeader("X-Media-Id");
        if (id) capturedMediaId = parseInt(id, 10);
      },
      onSuccess: async () => {
        if (capturedMediaId === null) {
          reject(new ApiError(500, "Upload succeeded but no media ID was returned"));
          return;
        }
        try {
          resolve(await apiClient.get<Media>(`/media/${capturedMediaId}`));
        } catch (err) {
          reject(err);
        }
      },
      onError: (err) => reject(new ApiError(0, err.message ?? "Upload failed")),
    });

    upload.start();
  });
}

function uploadSubTrack(
  mediaId: number,
  name: string,
  file: File,
): Promise<SubTrack> {
  const token = localStorage.getItem("access_token") ?? "";
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", name);

  return fetch(`${API_BASE}/media/${mediaId}/subtracks`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: "Request failed" }));
      throw new ApiError(res.status, body.message ?? "Request failed");
    }
    return res.json() as Promise<SubTrack>;
  });
}

export const mediaApi = {
  upload: (
    title: string,
    file: File,
    onProgress?: UploadProgressCallback,
  ): Promise<Media> => tusUpload(title, file, onProgress),

  uploadSubTrack: (mediaId: number, name: string, file: File): Promise<SubTrack> =>
    uploadSubTrack(mediaId, name, file),

  findAll: (): Promise<Media[]> => apiClient.get<Media[]>("/media/list"),

  findAllAdmin: (): Promise<Media[]> => apiClient.get<Media[]>("/media"),

  findOne: (id: number): Promise<Media> => apiClient.get<Media>(`/media/${id}`),

  remove: (id: number): Promise<void> => apiClient.delete<void>(`/media/${id}`),

  removeSubTrack: (mediaId: number, trackId: number): Promise<void> =>
    apiClient.delete<void>(`/media/${mediaId}/subtracks/${trackId}`),

  /** Returns a URL with the JWT token as a query param for use in <video src="..."> */
  streamUrl: (id: number): string => {
    const token = localStorage.getItem("access_token") ?? "";
    return `${API_BASE}/media/${id}/stream?token=${encodeURIComponent(token)}`;
  },

  /** Returns a URL for a subtrack file, authenticated via query param for use in <track src="..."> */
  subTrackUrl: (mediaId: number, trackId: number): string => {
    const token = localStorage.getItem("access_token") ?? "";
    return `${API_BASE}/media/${mediaId}/subtracks/${trackId}/stream?token=${encodeURIComponent(token)}`;
  },
};
