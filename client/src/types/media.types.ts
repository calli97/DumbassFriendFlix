export interface SubtitleTrack {
  index: number;
  language: string;
  label: string;
}

export interface Media {
  id: number;
  title: string;
  path: string;
  originalName: string;
  mimeType: string;
  subtitleTracks: SubtitleTrack[] | null;
  createdAt: string;
}
