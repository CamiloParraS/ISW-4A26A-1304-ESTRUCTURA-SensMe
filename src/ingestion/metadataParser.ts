import { parseBuffer } from "music-metadata/lib/core";

export interface RawMetadata {
  title: string | null;
  artist: string | null;
  album: string | null;
  albumArtist: string | null;
  year: number | null;
  trackNumber: number | null;
  duration: number;
  coverArt: Blob | null;
}

export async function parseMetadata(file: File): Promise<RawMetadata> {
  try {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const meta = await parseBuffer(buffer, file.type, {
      skipPostHeaders: true,
    });
    const { common, format } = meta;

    let coverArt: Blob | null = null;
    if (common.picture && common.picture.length > 0) {
      const picture = common.picture[0];
      coverArt = new Blob([picture.data.buffer.slice(0) as ArrayBuffer], {
        type: picture.format,
      });
    }

    return {
      title: common.title ?? null,
      artist: common.artist ?? null,
      album: common.album ?? null,
      albumArtist: common.albumartist ?? null,
      year: common.year ?? null,
      trackNumber: common.track?.no ?? null,
      duration: format.duration ?? 0,
      coverArt,
    };
  } catch {
    throw new Error("metadata_parse_failed");
  }
}
