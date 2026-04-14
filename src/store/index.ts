import { create } from "zustand";
import { LibraryMap } from "../ds/LibraryMap";
import { saveHandle, saveLibrary, saveTheme } from "../persistence";
import type {
  PlaylistId,
  QueueState,
  SortState,
  Theme,
  Track,
  TrackId,
} from "../types";
import {
  createPlaylistSlice,
  type PlaylistSlice,
  type PlaylistSliceState,
} from "./playlistSlice";
import { createQueueSlice, type QueueSlice } from "./queueSlice";

interface IngestionProgress {
  isImporting: boolean;
  processed: number;
  total: number;
}

type PlaylistModalState =
  | { type: "create"; trackId?: TrackId }
  | { type: "rename"; playlistId: PlaylistId }
  | { type: "delete"; playlistId: PlaylistId };

interface LibrarySlice {
  library: LibraryMap;
  libraryVersion: number;
  existingPaths: Set<string>;
  setLibrary: (tracks: Track[]) => void;
  addTracks: (tracks: Track[]) => void;
  removeTrack: (id: TrackId) => void;
  updateTrack: (id: TrackId, patch: Partial<Track>) => void;
}

interface UISlice {
  theme: Theme;
  activeView: "songs" | "library" | "albums" | "playlist";
  activePlaylistId: PlaylistId | null;
  sortState: SortState;
  libraryQuery: string;
  ingestionProgress: IngestionProgress;
  isQueueOpen: boolean;
  playlistModal: PlaylistModalState | null;
  setTheme: (theme: Theme) => void;
  setActiveView: (view: UISlice["activeView"]) => void;
  setActivePlaylistId: (playlistId: PlaylistId | null) => void;
  setSortState: (sortState: SortState) => void;
  setLibraryQuery: (query: string) => void;
  setIngestionProgress: (patch: Partial<IngestionProgress>) => void;
  setQueueOpen: (open: boolean) => void;
  openCreatePlaylistModal: (trackId?: TrackId) => void;
  openRenamePlaylistModal: (playlistId: PlaylistId) => void;
  openDeletePlaylistModal: (playlistId: PlaylistId) => void;
  closePlaylistModal: () => void;
}

export type Store = LibrarySlice &
  PlaylistSlice &
  QueueSlice &
  UISlice &
  PlaylistSliceState;

export const defaultQueueState: QueueState = {
  currentTrackId: null,
  queue: [],
  history: [],
  shuffleEnabled: false,
  repeatMode: "off",
  originalOrder: [],
};

function createLibrarySlice(
  set: (partial: Partial<Store> | ((state: Store) => Partial<Store>)) => void,
): LibrarySlice {
  return {
    library: new LibraryMap(),
    libraryVersion: 0,
    existingPaths: new Set<string>(),

    setLibrary: (tracks) =>
      set((state) => {
        try {
          for (const existing of state.library.toArray()) {
            if (existing.coverArtUrl?.startsWith("blob:")) {
              try {
                URL.revokeObjectURL(existing.coverArtUrl);
              } catch {
                // ignore
              }
            }
          }
        } catch {
          // ignore
        }

        const nextLibrary = new LibraryMap();
        for (const track of tracks) {
          nextLibrary.add(track);
        }

        void Promise.all(
          tracks.map((track) =>
            saveHandle(track.id, track.fileHandle).catch(() => undefined),
          ),
        );

        saveLibrary(nextLibrary.toArray());

        return {
          library: nextLibrary,
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

        if (track.coverArtUrl?.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(track.coverArtUrl);
          } catch {
            // ignore
          }
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
  };
}

export const useStore = create<Store>((set, get) => ({
  ...createLibrarySlice(set),
  ...createPlaylistSlice(set),
  ...createQueueSlice(set, get),
  theme: "system",
  activeView: "songs",
  activePlaylistId: null,
  sortState: {
    field: "title",
    dir: "asc",
  },
  libraryQuery: "",
  ingestionProgress: {
    isImporting: false,
    processed: 0,
    total: 0,
  },
  isQueueOpen: false,
  playlistModal: null,
  setTheme: (theme) =>
    set(() => {
      saveTheme(theme);
      return { theme };
    }),
  setActiveView: (activeView) => set({ activeView }),
  setActivePlaylistId: (activePlaylistId) => set({ activePlaylistId }),
  setSortState: (sortState) => set({ sortState }),
  setLibraryQuery: (libraryQuery) => set({ libraryQuery }),
  setIngestionProgress: (patch) =>
    set((state) => ({
      ingestionProgress: {
        ...state.ingestionProgress,
        ...patch,
      },
    })),
  setQueueOpen: (isQueueOpen) => set({ isQueueOpen }),
  openCreatePlaylistModal: (trackId) =>
    set({ playlistModal: { type: "create", trackId } }),
  openRenamePlaylistModal: (playlistId) =>
    set({ playlistModal: { type: "rename", playlistId } }),
  openDeletePlaylistModal: (playlistId) =>
    set({ playlistModal: { type: "delete", playlistId } }),
  closePlaylistModal: () => set({ playlistModal: null }),
}));
