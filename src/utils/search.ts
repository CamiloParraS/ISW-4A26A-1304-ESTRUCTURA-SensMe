import type { Track } from "../types";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function searchTracks(query: string, tracks: Track[]): Track[] {
  const normalized = normalize(query);

  if (!normalized) {
    return tracks;
  }

  return tracks.filter((track) => {
    return (
      normalize(track.title).includes(normalized) ||
      normalize(track.artist).includes(normalized) ||
      normalize(track.album).includes(normalized)
    );
  });
}
