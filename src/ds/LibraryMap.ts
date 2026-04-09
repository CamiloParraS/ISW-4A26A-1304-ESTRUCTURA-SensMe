import type {
  Album,
  AlbumKey,
  Artist,
  ArtistName,
  Track,
  TrackId,
} from "../types";

function resolveArtistName(track: Track): ArtistName {
  return track.albumArtist || track.artist || "Unknown Artist";
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

export class LibraryMap {
  private tracks = new Map<TrackId, Track>();
  albums = new Map<AlbumKey, Album>();
  artists = new Map<ArtistName, Artist>();

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

  private rebuildIndices(): void {
    const albumBuckets = new Map<AlbumKey, Track[]>();
    const artistBuckets = new Map<
      ArtistName,
      { albumKeys: Set<AlbumKey>; trackIds: TrackId[] }
    >();

    for (const track of this.tracks.values()) {
      const albumKey = resolveAlbumKey(track);
      const artistName = resolveArtistName(track);

      const albumTracks = albumBuckets.get(albumKey);
      if (albumTracks) {
        albumTracks.push(track);
      } else {
        albumBuckets.set(albumKey, [track]);
      }

      const artistBucket = artistBuckets.get(artistName);
      if (artistBucket) {
        artistBucket.albumKeys.add(albumKey);
        artistBucket.trackIds.push(track.id);
      } else {
        artistBuckets.set(artistName, {
          albumKeys: new Set([albumKey]),
          trackIds: [track.id],
        });
      }
    }

    this.albums.clear();
    this.artists.clear();

    for (const [albumKey, tracks] of albumBuckets) {
      const sortedTracks = [...tracks].sort(compareAlbumTracks);
      const firstTrack = sortedTracks[0];
      const coverArtTrack = sortedTracks.find((track) => track.coverArtUrl);

      this.albums.set(albumKey, {
        key: albumKey,
        title: firstTrack?.album || "Unknown Album",
        artist: resolveArtistName(firstTrack),
        year: firstTrack?.year ?? null,
        coverArtUrl: coverArtTrack?.coverArtUrl ?? null,
        trackIds: sortedTracks.map((track) => track.id),
      });
    }

    for (const [artistName, bucket] of artistBuckets) {
      this.artists.set(artistName, {
        name: artistName,
        albumKeys: bucket.albumKeys,
        trackIds: bucket.trackIds,
      });
    }
  }
}
