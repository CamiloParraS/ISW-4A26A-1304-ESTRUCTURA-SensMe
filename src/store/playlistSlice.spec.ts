import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Playlist, SerializedPlaylist } from "../types";
import { createPlaylistSlice, type PlaylistSliceState } from "./playlistSlice";

vi.mock("../persistence", () => ({
  savePlaylists: vi.fn(),
}));

interface SliceState extends PlaylistSliceState {
  playlists: Playlist[];
  activePlaylistId: string | null;
}

function makePlaylist(id: string, trackIds: string[]): Playlist {
  return {
    id,
    name: id,
    trackIds,
    trackIdSet: new Set(trackIds),
    createdAt: 1,
    updatedAt: 1,
  };
}

function createHarness(initial?: Partial<SliceState>) {
  let state: SliceState = {
    playlists: [],
    activePlaylistId: null,
    ...initial,
  };

  const set = (
    partial:
      | Partial<SliceState>
      | ((current: SliceState) => Partial<SliceState>),
  ) => {
    const resolved = typeof partial === "function" ? partial(state) : partial;
    state = { ...state, ...resolved };
  };

  const slice = createPlaylistSlice<SliceState>(set);

  return {
    slice,
    getState: () => state,
  };
}

describe("playlistSlice", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("createPlaylist creates a playlist with array and Set", () => {
    const { slice, getState } = createHarness();

    const playlist = slice.createPlaylist("Roadtrip");

    expect(playlist.name).toBe("Roadtrip");
    expect(playlist.trackIds).toEqual([]);
    expect(playlist.trackIdSet.size).toBe(0);
    expect(typeof playlist.id).toBe("string");

    expect(getState().playlists).toHaveLength(1);
    expect(getState().playlists[0]?.trackIdSet).toBeInstanceOf(Set);
  });

  it("setPlaylists hydrates trackIdSet from serialized payload", () => {
    const serialized: SerializedPlaylist[] = [
      {
        id: "p1",
        name: "Hydrated",
        trackIds: ["t1", "t2"],
        createdAt: 1,
        updatedAt: 1,
      },
    ];
    const { slice, getState } = createHarness();

    slice.setPlaylists(serialized);

    const hydrated = getState().playlists[0];
    expect(hydrated?.trackIds).toEqual(["t1", "t2"]);
    expect(hydrated?.trackIdSet.has("t1")).toBe(true);
    expect(hydrated?.trackIdSet.has("t2")).toBe(true);
  });

  it("addTrackToPlaylist is idempotent", () => {
    const { slice, getState } = createHarness({
      playlists: [makePlaylist("p1", ["t1"])],
    });

    slice.addTrackToPlaylist("p1", "t1");
    slice.addTrackToPlaylist("p1", "t1");

    expect(getState().playlists[0]?.trackIds).toEqual(["t1"]);
    expect(getState().playlists[0]?.trackIdSet.size).toBe(1);
  });

  it("removeTrackFromPlaylist keeps Set and array in sync", () => {
    const { slice, getState } = createHarness({
      playlists: [makePlaylist("p1", ["t1", "t2", "t3"])],
    });

    slice.removeTrackFromPlaylist("p1", "t2");

    expect(getState().playlists[0]?.trackIds).toEqual(["t1", "t3"]);
    expect(getState().playlists[0]?.trackIdSet.has("t2")).toBe(false);
    expect(getState().playlists[0]?.trackIdSet.has("t3")).toBe(true);
  });

  it("reorderPlaylistTracks moves index 0 to the end", () => {
    const { slice, getState } = createHarness({
      playlists: [makePlaylist("p1", ["t1", "t2", "t3"])],
    });

    slice.reorderPlaylistTracks("p1", 0, 2);

    expect(getState().playlists[0]?.trackIds).toEqual(["t2", "t3", "t1"]);
  });

  it("deletePlaylist clears active playlist when deleting active id", () => {
    const { slice, getState } = createHarness({
      playlists: [makePlaylist("p1", ["t1"]), makePlaylist("p2", ["t2"])],
      activePlaylistId: "p2",
    });

    slice.deletePlaylist("p2");

    expect(getState().playlists.map((playlist) => playlist.id)).toEqual(["p1"]);
    expect(getState().activePlaylistId).toBeNull();
  });
});
