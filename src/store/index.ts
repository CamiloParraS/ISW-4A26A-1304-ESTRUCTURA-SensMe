import { create } from "zustand";
import { LibraryMap } from "../ds/LibraryMap";
import {
  saveHandle,
  saveLibrary,
  savePlaylists,
  saveQueueState,
  saveTheme,
} from "../persistence";
import type {
  Playlist,
  PlaylistId,
  QueueState,
  Theme,
  Track,
  TrackId,
} from "../types";

interface LibrarySlice {
  library: LibraryMap;
  libraryVersion: number;
  existingPaths: Set<string>;
  setLibrary: (tracks: Track[]) => void;
  addTracks: (tracks: Track[]) => void;
  removeTrack: (id: TrackId) => void;
  updateTrack: (id: TrackId, patch: Partial<Track>) => void;
}

interface PlaylistSlice {
  playlists: Playlist[];
  setPlaylists: (playlists: Playlist[]) => void;
}

interface QueueSlice {
  queueState: QueueState;
  setQueueState: (queueState: QueueState) => void;
}

interface UISlice {
  theme: Theme;
  activeView: "library" | "albums" | "playlist";
  activePlaylistId: PlaylistId | null;
  isQueueOpen: boolean;
  setTheme: (theme: Theme) => void;
  setActiveView: (view: UISlice["activeView"]) => void;
  setQueueOpen: (open: boolean) => void;
}

export type Store = LibrarySlice & PlaylistSlice & QueueSlice & UISlice;

export const defaultQueueState: QueueState = {
  currentTrackId: null,
  queue: [],
  history: [],
  shuffleEnabled: false,
  repeatMode: "off",
  originalOrder: [],
};

export const useStore = create<Store>((set) => ({
  library: new LibraryMap(),
  libraryVersion: 0,
  existingPaths: new Set<string>(),
  playlists: [],
  queueState: defaultQueueState,
  theme: "system",
  activeView: "library",
  activePlaylistId: null,
  isQueueOpen: false,
  setLibrary: (tracks) =>
    set((state) => {
      const library = new LibraryMap();

      for (const track of tracks) {
        library.add(track);
      }

      void Promise.all(
        tracks.map((track) =>
          saveHandle(track.id, track.fileHandle).catch(() => undefined),
        ),
      );

      saveLibrary(library.toArray());

      return {
        library,
        libraryVersion: state.libraryVersion + 1,
        existingPaths: new Set(tracks.map((track) => track.filePath)),
      };
    }),
  addTracks: (tracks) =>
    set((state) => {
      const nextExistingPaths = new Set(state.existingPaths);

      for (const track of tracks) {
        if (
          nextExistingPaths.has(track.filePath) ||
          state.library.has(track.id)
        ) {
          continue;
        }

        state.library.add(track);
        nextExistingPaths.add(track.filePath);

        void saveHandle(track.id, track.fileHandle).catch(() => undefined);
      }

      saveLibrary(state.library.toArray());

      return {
        library: state.library,
        libraryVersion: state.libraryVersion + 1,
        existingPaths: nextExistingPaths,
      };
    }),
  removeTrack: (id) =>
    set((state) => {
      const track = state.library.get(id);

      if (!track) {
        return {};
      }

      state.library.remove(id);

      const nextExistingPaths = new Set(state.existingPaths);
      nextExistingPaths.delete(track.filePath);

      saveLibrary(state.library.toArray());

      return {
        library: state.library,
        libraryVersion: state.libraryVersion + 1,
        existingPaths: nextExistingPaths,
      };
    }),
  updateTrack: (id, patch) =>
    set((state) => {
      const track = state.library.get(id);

      if (!track) {
        return {};
      }

      state.library.update(id, patch);

      const nextExistingPaths = new Set(state.existingPaths);
      if (patch.filePath && patch.filePath !== track.filePath) {
        nextExistingPaths.delete(track.filePath);
        nextExistingPaths.add(patch.filePath);
      }

      saveLibrary(state.library.toArray());

      return {
        library: state.library,
        libraryVersion: state.libraryVersion + 1,
        existingPaths: nextExistingPaths,
      };
    }),
  setPlaylists: (playlists) =>
    set(() => {
      savePlaylists(playlists);
      return { playlists };
    }),
  setQueueState: (queueState) =>
    set(() => {
      saveQueueState(queueState);
      return { queueState };
    }),
  setTheme: (theme) =>
    set(() => {
      saveTheme(theme);
      return { theme };
    }),
  setActiveView: (activeView) => set({ activeView }),
  setQueueOpen: (isQueueOpen) => set({ isQueueOpen }),
}));
