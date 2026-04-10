import type {
  Album,
  AlbumKey,
  Artist,
  ArtistName,
  Track,
  TrackId,
} from "../types";

interface AlbumBucket {
  key: AlbumKey;
  title: string;
  artist: string;
  year: number | null;
  coverArtUrl: string | null;
  trackIds: TrackId[];
}

interface ArtistBucket {
  name: ArtistName;
  albumKeys: Set<AlbumKey>;
  trackIds: TrackId[];
}

function resolveArtistName(track: Track | undefined): ArtistName {
  return track?.albumArtist || track?.artist || "Unknown Artist";
}

function resolveAlbumKey(track: Track): AlbumKey {
  return `${resolveArtistName(track)}::${track.album || "Unknown Album"}`;
}

function compareAlbumTracks(left: Track, right: Track): number {
  const leftNumber = left.trackNumber ?? Number.POSITIVE_INFINITY;
  const rightNumber = right.trackNumber ?? Number.POSITIVE_INFINITY;

  if (leftNumber !== rightNumber) {
    return leftNumber - rightNumber;
  }

  const titleComparison = left.title.localeCompare(right.title);

  if (titleComparison !== 0) {
    return titleComparison;
  }

  return left.id.localeCompare(right.id);
}

function sortTrackIds(
  trackIds: TrackId[],
  tracksById: Map<TrackId, Track>,
): TrackId[] {
  return [...trackIds].sort((leftId, rightId) => {
    const left = tracksById.get(leftId);
    const right = tracksById.get(rightId);

    if (!left || !right) {
      return leftId.localeCompare(rightId);
    }

    return compareAlbumTracks(left, right);
  });
}

export class LibraryMap {
  private tracks = new Map<TrackId, Track>();
  private albumBuckets = new Map<AlbumKey, AlbumBucket>();
  private artistBuckets = new Map<ArtistName, ArtistBucket>();

  add(track: Track): void {
    if (this.tracks.has(track.id)) return;

    this.tracks.set(track.id, track);
    this.rebuildIndices();
  }

  remove(id: TrackId): void {
    if (!this.tracks.delete(id)) return;

    this.rebuildIndices();
  }

  update(id: TrackId, patch: Partial<Track>): void {
    const existing = this.tracks.get(id);

    if (!existing) return;

    this.tracks.set(id, { ...existing, ...patch, id });
    this.rebuildIndices();
  }

  get(id: TrackId): Track | undefined {
    return this.tracks.get(id);
  }

  has(id: TrackId): boolean {
    return this.tracks.has(id);
  }

  values(): IterableIterator<Track> {
    return this.tracks.values();
  }

  size(): number {
    return this.tracks.size;
  }

  toArray(): Track[] {
    return [...this.tracks.values()];
  }

  get albums(): ReadonlyMap<AlbumKey, Album> {
    return new Map(
      [...this.albumBuckets.entries()].map(([albumKey, bucket]) => [
        albumKey,
        this.toAlbum(bucket),
      ]),
    );
  }

  get artists(): ReadonlyMap<ArtistName, Artist> {
    return new Map(
      [...this.artistBuckets.entries()].map(([artistName, bucket]) => [
        artistName,
        this.toArtist(bucket),
      ]),
    );
  }

  getAlbum(albumKey: AlbumKey): Album | undefined {
    const bucket = this.albumBuckets.get(albumKey);

    return bucket ? this.toAlbum(bucket) : undefined;
  }

  getArtist(artistName: ArtistName): Artist | undefined {
    const bucket = this.artistBuckets.get(artistName);

    return bucket ? this.toArtist(bucket) : undefined;
  }

  private rebuildIndices(): void {
    this.albumBuckets.clear();
    this.artistBuckets.clear();

    for (const track of this.tracks.values()) {
      const albumKey = resolveAlbumKey(track);
      const artistName = resolveArtistName(track);

      const albumBucket = this.albumBuckets.get(albumKey);
      if (albumBucket) {
        albumBucket.trackIds.push(track.id);
      } else {
        this.albumBuckets.set(albumKey, {
          key: albumKey,
          title: track.album || "Unknown Album",
          artist: artistName,
          year: track.year ?? null,
          coverArtUrl: track.coverArtUrl,
          trackIds: [track.id],
        });
      }

      const artistBucket = this.artistBuckets.get(artistName);
      if (artistBucket) {
        artistBucket.albumKeys.add(albumKey);
        artistBucket.trackIds.push(track.id);
      } else {
        this.artistBuckets.set(artistName, {
          name: artistName,
          albumKeys: new Set([albumKey]),
          trackIds: [track.id],
        });
      }
    }
  }

  private toAlbum(bucket: AlbumBucket): Album {
    const sortedTrackIds = sortTrackIds(bucket.trackIds, this.tracks);
    const firstTrack =
      sortedTrackIds.length > 0
        ? this.tracks.get(sortedTrackIds[0])
        : undefined;
    const coverArtTrackId = bucket.trackIds.find(
      (trackId) => this.tracks.get(trackId)?.coverArtUrl,
    );
    const coverArtTrack = coverArtTrackId
      ? this.tracks.get(coverArtTrackId)
      : undefined;

    return {
      key: bucket.key,
      title: firstTrack?.album || bucket.title,
      artist: resolveArtistName(firstTrack) || bucket.artist,
      year: firstTrack?.year ?? bucket.year,
      coverArtUrl: coverArtTrack?.coverArtUrl ?? bucket.coverArtUrl,
      trackIds: sortedTrackIds,
    };
  }

  private toArtist(bucket: ArtistBucket): Artist {
    return {
      name: bucket.name,
      albumKeys: new Set(bucket.albumKeys),
      trackIds: [...bucket.trackIds],
    };
  }
}
