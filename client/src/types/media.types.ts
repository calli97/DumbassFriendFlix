export interface Media {
  id: number;
  title: string;
  path: string;
  originalName: string;
  mimeType: string;
  imdbLink: string | null;
  storageType: "local" | "minio";
  createdAt: string;
}
