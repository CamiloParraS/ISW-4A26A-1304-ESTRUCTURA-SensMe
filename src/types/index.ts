export type TrackId = string;
export type AlbumKey = string;
export type ArtistName = string;
export type PlaylistId = string;

export interface TrackEditable {
  title: string;
  artist: string;
  album: string;
  albumArtist: string;
  year: number | null;
  trackNumber: number | null;
}

export interface Track {
  id: TrackId;
  fileHandle: FileSystemFileHandle;
  filePath: string;
  title: string;
  artist: string;
  album: string;
  albumArtist: string;
  year: number | null;
  trackNumber: number | null;
  duration: number;
  coverArtUrl: string | null;
  playCount: number;
  lastPlayed: number | null;
}

export interface TrackStats {
  playCount: number;
  lastPlayed: number | null;
}

export type TrackOverrides = Partial<TrackEditable>;

export interface TrackRecord extends Track, TrackStats {
  manualEdits: TrackOverrides | null;
}

export interface ResolvedTrack extends Track, TrackStats {
  manualEdits: TrackOverrides | null;
  resolvedTitle: string;
  resolvedArtist: string;
  resolvedAlbum: string;
  resolvedAlbumArtist: string;
  resolvedYear: number | null;
  resolvedTrackNumber: number | null;
}

export interface Album {
  key: AlbumKey;
  title: string;
  artist: string;
  year: number | null;
  coverArtUrl: string | null;
  trackIds: TrackId[];
}

export interface Artist {
  name: ArtistName;
  albumKeys: Set<AlbumKey>;
  trackIds: TrackId[];
}

export interface Playlist {
  id: PlaylistId;
  name: string;
  trackIds: TrackId[];
  createdAt: number;
  updatedAt: number;
}

export type RepeatMode = "off" | "one" | "all";

export interface QueueState {
  currentTrackId: TrackId | null;
  queue: TrackId[];
  history: TrackId[];
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  originalOrder: TrackId[];
  // Invariant:
  // - queue is the active upcoming order.
  // - originalOrder is the shuffle snapshot used to restore order.
  // - when shuffle is enabled, both arrays must be updated together.
}

export interface ImportError {
  fileName: string;
  reason: string;
}

export interface ImportResult {
  imported: number;
  errors: ImportError[];
}

export interface TrackHandleRecord {
  trackId: TrackId;
  fileHandle: FileSystemFileHandle;
}

export interface ImportReconciliationCandidate {
  filePath: string;
  title: string;
  artist: string;
  album: string;
  albumArtist: string;
  year: number | null;
  trackNumber: number | null;
}

export type SerializedTrack = Omit<Track, "fileHandle">;
export type SerializedPlaylist = Playlist;

export type Theme = "light" | "dark" | "system";

export type SortField = "title" | "artist" | "album" | "duration" | "playCount";
export type SortDir = "asc" | "desc";

export interface SortState {
  field: SortField;
  dir: SortDir;
}
