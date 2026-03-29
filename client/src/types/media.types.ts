export interface SubTrack {
  id: number;
  name: string;
  path: string;
  mediaId: number;
}

export interface Media {
  id: number;
  title: string;
  path: string;
  originalName: string;
  mimeType: string;
  imdbLink: string | null;
  subTracks: SubTrack[];
  createdAt: string;
}
