export type TrackId = string
export type AlbumKey = string
export type ArtistName = string
export type PlaylistId = string

export interface TrackEditable {
    title: string
    artist: string
    album: string
    albumArtist: string
    year: number | null
    trackNumber: number | null
}

export interface Track {
    id: TrackId
    fileHandle: FileSystemFileHandle
    filePath: string
    title: string
    artist: string
    album: string
    albumArtist: string
    year: number | null
    trackNumber: number | null
    duration: number
    coverArtUrl: string | null
    playCount: number
    lastPlayed: number | null
    manualEdits: Partial<TrackEditable> | null
}

export interface Album {
    key: AlbumKey
    title: string
    artist: string
    year: number | null
    coverArtUrl: string | null
    trackIds: TrackId[]
}

export interface Artist {
    name: ArtistName
    albumKeys: Set<AlbumKey>
    trackIds: TrackId[]
}

export interface Playlist {
    id: PlaylistId
    name: string
    trackIds: TrackId[]
    trackIdSet: Set<TrackId>
    createdAt: number
    updatedAt: number
}

export type RepeatMode = 'off' | 'one' | 'all'

export interface QueueState {
    currentTrackId: TrackId | null
    queue: TrackId[]
    history: TrackId[]
    shuffleEnabled: boolean
    repeatMode: RepeatMode
    originalOrder: TrackId[]
}

export interface ImportError {
    fileName: string
    reason: string
}

export interface ImportResult {
    imported: number
    errors: ImportError[]
}

export interface SerializedTrack extends Omit<Track, 'fileHandle' | 'manualEdits'> {
    manualEdits: Partial<TrackEditable> | null
}

export interface SerializedPlaylist extends Omit<Playlist, 'trackIdSet'> { }

export type Theme = 'light' | 'dark' | 'system'
