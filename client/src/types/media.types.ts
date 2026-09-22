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

export type MediaOption = Pick<Media, "id" | "title">;

export interface MediaFilters {
  name?: string;
  recommendedById?: number;
}

export interface PaginatedMedia {
  data: Media[];
  total: number;
  page: number;
  limit: number;
}
