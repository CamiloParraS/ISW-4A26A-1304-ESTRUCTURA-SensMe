import type { MBResult } from "./musicbrainz";
import type { RawMetadata } from "./metadataParser";
import type { Track } from "../types";

function fileNameWithoutExt(path: string): string {
  const base = path.split(/[\\/]/).pop() ?? path;
  return base.replace(/\.[^.]+$/, "");
}

export function buildTrack(
  handle: FileSystemFileHandle | File,
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

  // If we were handed a plain File (e.g. from drag/drop), wrap it with a
  // minimal FileSystemFileHandle-like shim so the rest of the app can call
  // `getFile()` and the `Track.fileHandle` remains typed as
  // `FileSystemFileHandle`.
  const fileHandle: FileSystemFileHandle =
    typeof (handle as any).getFile === "function"
      ? (handle as FileSystemFileHandle)
      : ({
          getFile: async () => handle as File,
          name: (handle as File).name,
        } as unknown as FileSystemFileHandle);

  return {
    id: crypto.randomUUID(),
    fileHandle,
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
