import type { MBResult } from "./musicbrainz";
import type { RawMetadata } from "./metadataParser";
import type { Track } from "../types";

function fileNameWithoutExt(path: string): string {
  const base = path.split(/[\\/]/).pop() ?? path;
  return base.replace(/\.[^.]+$/, "");
}

export function buildTrack(
  handle: FileSystemFileHandle,
  filePath: string,
  raw: RawMetadata,
  mb: MBResult | null,
  existingCoverArtUrl: string | null,
): Track {
  const artist = raw.artist || "Unknown Artist";
  const albumArtist = raw.albumArtist || artist;

  let coverArtUrl: string | null = null;
  if (raw.coverArt) {
    coverArtUrl = URL.createObjectURL(raw.coverArt);
  } else if (mb?.coverArtUrl) {
    coverArtUrl = mb.coverArtUrl;
  } else if (existingCoverArtUrl) {
    coverArtUrl = existingCoverArtUrl;
  }

  return {
    id: crypto.randomUUID(),
    fileHandle: handle,
    filePath,
    title: raw.title || fileNameWithoutExt(filePath),
    artist,
    album: raw.album || "Unknown Album",
    albumArtist,
    year: raw.year ?? mb?.year ?? null,
    trackNumber: raw.trackNumber ?? null,
    duration: raw.duration,
    coverArtUrl,
    playCount: 0,
    lastPlayed: null,
  };
}
