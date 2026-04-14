import { get as idbGet, set as idbSet } from "idb-keyval";
import { parseMetadata } from "../ingestion/metadataParser";
import type {
  Playlist,
  QueueState,
  SerializedPlaylist,
  SerializedTrack,
  Theme,
  Track,
} from "../types";

const LS_LIBRARY = "wplayer_library";
const LS_PLAYLISTS = "wplayer_playlists";
const LS_QUEUE = "wplayer_queue";
const LS_THEME = "wplayer_theme";
const IDB_PREFIX = "handle::";

export interface PersistedAppState {
  tracks: Track[];
  playlists: SerializedPlaylist[];
  queueState: QueueState | null;
  theme: Theme;
}

function serializeTrack(track: Track): SerializedTrack {
  const { fileHandle, ...rest } = track;
  void fileHandle;
  return rest;
}

function parseJSON<T>(raw: string | null): T | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveLibrary(tracks: Track[]): void {
  try {
    const data = tracks.map(serializeTrack);
    localStorage.setItem(LS_LIBRARY, JSON.stringify(data));
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("[Persistence] localStorage quota exceeded");
    }
  }
}

export function loadSerializedTracks(): SerializedTrack[] {
  return parseJSON<SerializedTrack[]>(localStorage.getItem(LS_LIBRARY)) ?? [];
}

export async function saveHandle(
  trackId: string,
  handle: FileSystemFileHandle,
): Promise<void> {
  await idbSet(`${IDB_PREFIX}${trackId}`, handle);
}

export async function loadHandle(
  trackId: string,
): Promise<FileSystemFileHandle | undefined> {
  return idbGet<FileSystemFileHandle>(`${IDB_PREFIX}${trackId}`);
}

export async function hydrateLibrary(
  serialized: SerializedTrack[],
): Promise<Track[]> {
  type PermissionHandle = FileSystemFileHandle & {
    getFile: () => Promise<File>;
    queryPermission: (descriptor: {
      mode: "read" | "readwrite";
    }) => Promise<"granted" | "denied" | "prompt">;
    requestPermission: (descriptor: {
      mode: "read" | "readwrite";
    }) => Promise<"granted" | "denied" | "prompt">;
  };

  const hydrated = await Promise.all(
    serialized.map(async (track) => {
      try {
        const handle = await loadHandle(track.id);

        if (!handle) {
          return null;
        }

        const permissionHandle = handle as PermissionHandle;
        const queryPermission = await permissionHandle.queryPermission({
          mode: "read",
        });
        if (queryPermission !== "granted") {
          const requestPermission = await permissionHandle.requestPermission({
            mode: "read",
          });
          if (requestPermission !== "granted") {
            return null;
          }
        }

        let coverArtUrl = track.coverArtUrl;

        if (coverArtUrl?.startsWith("blob:")) {
          try {
            const file = await permissionHandle.getFile();
            const raw = await parseMetadata(file);

            if (raw.coverArt) {
              coverArtUrl = URL.createObjectURL(raw.coverArt);
            } else {
              coverArtUrl = null;
            }
          } catch {
            coverArtUrl = null;
          }
        }

        return {
          ...track,
          coverArtUrl,
          fileHandle: handle,
          playCount: track.playCount ?? 0,
          lastPlayed: track.lastPlayed ?? null,
        };
      } catch {
        return null;
      }
    }),
  );

  return hydrated.filter((track): track is Track => track !== null);
}

export function savePlaylists(playlists: Playlist[]): void {
  const serialized: SerializedPlaylist[] = playlists.map(
    ({ trackIdSet, ...playlist }) => {
      void trackIdSet;
      return playlist;
    },
  );

  localStorage.setItem(LS_PLAYLISTS, JSON.stringify(serialized));
}

export function loadPlaylists(): SerializedPlaylist[] {
  return (
    parseJSON<SerializedPlaylist[]>(localStorage.getItem(LS_PLAYLISTS)) ?? []
  );
}

export function saveQueueState(queueState: QueueState): void {
  localStorage.setItem(LS_QUEUE, JSON.stringify(queueState));
}

export function loadQueueState(): QueueState | null {
  return parseJSON<QueueState>(localStorage.getItem(LS_QUEUE));
}

export function saveTheme(theme: Theme): void {
  localStorage.setItem(LS_THEME, theme);
}

export function loadTheme(): Theme {
  const theme = localStorage.getItem(LS_THEME);
  return theme === "light" || theme === "dark" || theme === "system"
    ? theme
    : "system";
}

export async function loadPersistedAppState(): Promise<PersistedAppState> {
  const serializedTracks = loadSerializedTracks();
  const tracks = await hydrateLibrary(serializedTracks);

  return {
    tracks,
    playlists: loadPlaylists(),
    queueState: loadQueueState(),
    theme: loadTheme(),
  };
}
