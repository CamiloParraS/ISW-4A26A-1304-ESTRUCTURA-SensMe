import { savePlaylists } from "../persistence";
import { PlaylistOrder } from "./playlistOrder";
import type {
  Playlist,
  PlaylistId,
  SerializedPlaylist,
  TrackId,
} from "../types";

export interface PlaylistSliceState {
  playlists: Playlist[];
  activePlaylistId: PlaylistId | null;
}

export interface PlaylistSlice {
  playlists: Playlist[];
  setPlaylists: (playlists: SerializedPlaylist[]) => void;
  createPlaylist: (name: string) => Playlist;
  renamePlaylist: (id: PlaylistId, name: string) => void;
  deletePlaylist: (id: PlaylistId) => void;
  addTrackToPlaylist: (
    playlistId: PlaylistId,
    trackId: TrackId,
  ) => AddTrackToPlaylistResult;
  removeTrackFromPlaylist: (playlistId: PlaylistId, trackId: TrackId) => void;
  reorderPlaylistTracks: (
    playlistId: PlaylistId,
    fromIdx: number,
    toIdx: number,
  ) => void;
  moveTrackInPlaylist: (
    playlistId: PlaylistId,
    trackId: TrackId,
    toIdx: number,
  ) => void;
}

export type AddTrackToPlaylistResult =
  | "added"
  | "already-in-playlist"
  | "playlist-not-found";

type SliceSetter<T> = (
  partial: Partial<T> | ((state: T) => Partial<T>),
) => void;

function hydratePlaylist(playlist: SerializedPlaylist): Playlist {
  return {
    ...playlist,
    trackIdSet: new Set(playlist.trackIds),
  };
}

function withUpdatedTrackIds(
  playlist: Playlist,
  trackIds: TrackId[],
): Playlist {
  return {
    ...playlist,
    trackIds,
    trackIdSet: new Set(trackIds),
    updatedAt: Date.now(),
  };
}

function clampIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(index, length - 1));
}

export function createPlaylistSlice<T extends PlaylistSliceState>(
  set: SliceSetter<T>,
): PlaylistSlice {
  return {
    playlists: [],

    setPlaylists: (playlists) =>
      set(() => {
        const hydrated = playlists.map(hydratePlaylist);
        savePlaylists(hydrated);
        return { playlists: hydrated } as Partial<T>;
      }),

    createPlaylist: (name) => {
      const now = Date.now();
      const playlist: Playlist = {
        id: crypto.randomUUID(),
        name,
        trackIds: [],
        trackIdSet: new Set(),
        createdAt: now,
        updatedAt: now,
      };

      set((state) => {
        const playlists = [...state.playlists, playlist];
        savePlaylists(playlists);
        return { playlists } as Partial<T>;
      });

      return playlist;
    },

    renamePlaylist: (id, name) =>
      set((state) => {
        const playlists = state.playlists.map((playlist) =>
          playlist.id === id
            ? { ...playlist, name, updatedAt: Date.now() }
            : playlist,
        );

        savePlaylists(playlists);
        return { playlists } as Partial<T>;
      }),

    deletePlaylist: (id) =>
      set((state) => {
        const playlists = state.playlists.filter(
          (playlist) => playlist.id !== id,
        );
        savePlaylists(playlists);

        return {
          playlists,
          activePlaylistId:
            state.activePlaylistId === id ? null : state.activePlaylistId,
        } as Partial<T>;
      }),

    addTrackToPlaylist: (playlistId, trackId) => {
      let result: AddTrackToPlaylistResult = "playlist-not-found";

      set((state) => {
        const playlists = state.playlists.map((playlist) => {
          if (playlist.id !== playlistId) {
            return playlist;
          }

          if (playlist.trackIdSet.has(trackId)) {
            result = "already-in-playlist";
            return playlist;
          }

          result = "added";

          const orderedTrackIds = PlaylistOrder.fromTrackIds(playlist.trackIds);
          orderedTrackIds.appendTrack(trackId);

          return withUpdatedTrackIds(
            playlist,
            orderedTrackIds.snapshotTrackIds(),
          );
        });

        savePlaylists(playlists);
        return { playlists } as Partial<T>;
      });

      return result;
    },

    removeTrackFromPlaylist: (playlistId, trackId) =>
      set((state) => {
        const playlists = state.playlists.map((playlist) => {
          if (playlist.id !== playlistId || !playlist.trackIdSet.has(trackId)) {
            return playlist;
          }

          const orderedTrackIds = PlaylistOrder.fromTrackIds(playlist.trackIds);
          if (!orderedTrackIds.removeTrack(trackId)) {
            return playlist;
          }

          return withUpdatedTrackIds(
            playlist,
            orderedTrackIds.snapshotTrackIds(),
          );
        });

        savePlaylists(playlists);
        return { playlists } as Partial<T>;
      }),

    reorderPlaylistTracks: (playlistId, fromIdx, toIdx) =>
      set((state) => {
        const playlists = state.playlists.map((playlist) => {
          if (playlist.id !== playlistId || playlist.trackIds.length === 0) {
            return playlist;
          }

          const startIndex = clampIndex(fromIdx, playlist.trackIds.length);
          const endIndex = clampIndex(toIdx, playlist.trackIds.length);
          if (startIndex === endIndex) {
            return playlist;
          }

          const orderedTrackIds = PlaylistOrder.fromTrackIds(playlist.trackIds);
          if (!orderedTrackIds.moveTrackByIndex(startIndex, endIndex)) {
            return playlist;
          }

          return withUpdatedTrackIds(
            playlist,
            orderedTrackIds.snapshotTrackIds(),
          );
        });

        savePlaylists(playlists);
        return { playlists } as Partial<T>;
      }),

    moveTrackInPlaylist: (playlistId, trackId, toIdx) =>
      set((state) => {
        const playlists = state.playlists.map((playlist) => {
          if (playlist.id !== playlistId) {
            return playlist;
          }

          const endIndex = clampIndex(toIdx, playlist.trackIds.length);
          const orderedTrackIds = PlaylistOrder.fromTrackIds(playlist.trackIds);
          if (!orderedTrackIds.moveTrack(trackId, endIndex)) {
            return playlist;
          }

          return withUpdatedTrackIds(
            playlist,
            orderedTrackIds.snapshotTrackIds(),
          );
        });

        savePlaylists(playlists);
        return { playlists } as Partial<T>;
      }),
  };
}
