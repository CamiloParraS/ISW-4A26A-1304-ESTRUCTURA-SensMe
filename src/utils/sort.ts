import type { SortDir, SortField, Track } from "../types";

const COMPARATORS: Record<SortField, (left: Track, right: Track) => number> = {
  title: (left, right) => left.title.localeCompare(right.title),
  artist: (left, right) => left.artist.localeCompare(right.artist),
  album: (left, right) => left.album.localeCompare(right.album),
  duration: (left, right) => left.duration - right.duration,
  playCount: (left, right) => left.playCount - right.playCount,
};

export function sortTracks(
  tracks: Track[],
  field: SortField,
  dir: SortDir,
): Track[] {
  const sorted = [...tracks].sort(COMPARATORS[field]);
  return dir === "desc" ? sorted.reverse() : sorted;
}
