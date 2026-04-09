import { create } from "zustand";
import { LibraryMap } from "../ds/LibraryMap";
import type { Playlist, PlaylistId, QueueState, Theme } from "../types";

interface LibrarySlice {
  library: LibraryMap;
}

interface PlaylistSlice {
  playlists: Playlist[];
}

interface QueueSlice {
  queueState: QueueState;
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
  playlists: [],
  queueState: defaultQueueState,
  theme: "system",
  activeView: "library",
  activePlaylistId: null,
  isQueueOpen: false,
  setTheme: (theme) => set({ theme }),
  setActiveView: (activeView) => set({ activeView }),
  setQueueOpen: (isQueueOpen) => set({ isQueueOpen }),
}));
