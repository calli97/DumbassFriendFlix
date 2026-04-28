import * as tus from "tus-js-client";
import { apiClient, ApiError } from "./client";
import { Media, MovieCapture } from "../types/media.types";
import { isMinioDirectAvailable } from "../utils/minio-probe";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api/v1";

export type UploadProgressCallback = (loaded: number, total: number) => void;

function tusUpload(
  title: string,
  file: File,
  onProgress?: UploadProgressCallback,
  storageType: "local" | "minio" = "local",
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
        storageType,
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

async function presignedMultipartUpload(
  title: string,
  file: File,
  onProgress?: UploadProgressCallback,
): Promise<Media> {
  const PART_SIZE = 10 * 1024 * 1024;

  const { uploadId, key } = await apiClient.post<{ uploadId: string; key: string }>(
    "/media/upload/create-multipart",
    { title, originalName: file.name, mimeType: file.type },
  );

  const totalParts = Math.ceil(file.size / PART_SIZE);
  let uploadedBytes = 0;

  try {
    for (let i = 0; i < totalParts; i++) {
      const partNumber = i + 1;
      const start = i * PART_SIZE;
      const end = Math.min(start + PART_SIZE, file.size);
      const chunk = file.slice(start, end);

      const { url } = await apiClient.get<{ url: string }>(
        `/media/upload/sign-part?key=${encodeURIComponent(key)}&uploadId=${encodeURIComponent(uploadId)}&partNumber=${partNumber}`,
      );

      await fetch(url, { method: "PUT", body: chunk });

      uploadedBytes += chunk.size;
      onProgress?.(uploadedBytes, file.size);
    }

    return apiClient.post<Media>("/media/upload/complete-multipart", {
      key,
      uploadId,
      title,
      originalName: file.name,
      mimeType: file.type,
    });
  } catch (err) {
    await apiClient.post("/media/upload/abort-multipart", { key, uploadId }).catch(() => undefined);
    throw err;
  }
}

export const mediaApi = {
  upload: async (
    title: string,
    file: File,
    onProgress?: UploadProgressCallback,
    storageType: "local" | "minio" = "local",
  ): Promise<Media> => {
    if (storageType === "minio" && (await isMinioDirectAvailable())) {
      return presignedMultipartUpload(title, file, onProgress);
    }
    return tusUpload(title, file, onProgress, storageType);
  },

  findAll: (): Promise<Media[]> => apiClient.get<Media[]>("/media/list"),

  findAllAdmin: (): Promise<Media[]> => apiClient.get<Media[]>("/media"),

  findOne: (id: number): Promise<Media> => apiClient.get<Media>(`/media/${id}`),

  update: (id: number, data: { title?: string; imdbLink?: string | null }): Promise<Media> =>
    apiClient.patch<Media>(`/media/${id}`, data),

  remove: (id: number): Promise<void> => apiClient.delete<void>(`/media/${id}`),

  streamUrl: (id: number): string => {
    const token = localStorage.getItem("access_token") ?? "";
    return `${API_BASE}/media/${id}/stream?token=${encodeURIComponent(token)}`;
  },

  getStreamUrl: async (id: number, storageType: "local" | "minio"): Promise<string> => {
    if (storageType === "minio" && (await isMinioDirectAvailable())) {
      const { url } = await apiClient.get<{ url: string }>(`/media/${id}/presign-stream`);
      return url;
    }
    const token = localStorage.getItem("access_token") ?? "";
    return `${API_BASE}/media/${id}/stream?token=${encodeURIComponent(token)}`;
  },

  captures: {
    list: (mediaId: number): Promise<MovieCapture[]> =>
      apiClient.get<MovieCapture[]>(`/media/${mediaId}/captures`),

    add: (mediaId: number, url: string): Promise<MovieCapture> =>
      apiClient.post<MovieCapture>(`/media/${mediaId}/captures`, { url }),

    remove: (mediaId: number, captureId: number): Promise<void> =>
      apiClient.delete<void>(`/media/${mediaId}/captures/${captureId}`),
  },
};
