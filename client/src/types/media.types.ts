export interface Media {
  id: number;
  title: string;
  path: string;
  originalName: string;
  mimeType: string;
  imdbLink: string | null;
  storageType: "local" | "minio";
  createdAt: string;
  captures?: MovieCapture[];
}

export interface MovieCapture {
  id: number;
  url: string;
  mediaId: number;
}
