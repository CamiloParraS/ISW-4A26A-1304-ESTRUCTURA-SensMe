import { beforeEach, describe, expect, it, vi } from "vitest";
import type { QueueState, TrackId } from "../types";
import { createQueueSlice } from "./queueSlice";

vi.mock("../persistence", () => ({
  saveQueueState: vi.fn(),
}));

interface SliceState {
  queueState: QueueState;
}

const BASE_QUEUE_STATE: QueueState = {
  currentTrackId: null,
  queue: [],
  history: [],
  shuffleEnabled: false,
  repeatMode: "off",
  originalOrder: [],
};

function createHarness(initialQueueState?: Partial<QueueState>) {
  let state: SliceState = {
    queueState: {
      ...BASE_QUEUE_STATE,
      ...initialQueueState,
    },
  };

  const set = (partial: { queueState: QueueState }) => {
    state = { ...state, ...partial };
  };

  const get = () => state;

  const slice = createQueueSlice<SliceState>(set, get);

  return {
    slice,
    getQueueState: () => state.queueState,
  };
}

describe("queueSlice", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("startQueue seeds current, upcoming queue, and history", () => {
    const { slice, getQueueState } = createHarness();

    slice.startQueue(["t1", "t2", "t3"], 1);

    expect(getQueueState()).toEqual({
      currentTrackId: "t2",
      queue: ["t3"],
      history: ["t1"],
      shuffleEnabled: false,
      repeatMode: "off",
      originalOrder: ["t1", "t2", "t3"],
    });
  });

  it("playNext advances queue and appends previous current to history", () => {
    const { slice, getQueueState } = createHarness({
      currentTrackId: "t1",
      queue: ["t2", "t3"],
      history: [],
      repeatMode: "off",
      originalOrder: ["t1", "t2", "t3"],
    });

    const next = slice.playNext();

    expect(next).toBe("t2");
    expect(getQueueState()).toEqual({
      currentTrackId: "t2",
      queue: ["t3"],
      history: ["t1"],
      shuffleEnabled: false,
      repeatMode: "off",
      originalOrder: ["t1", "t2", "t3"],
    });
  });

  it("playPrevious returns to prior history entry and requeues current", () => {
    const { slice, getQueueState } = createHarness({
      currentTrackId: "t3",
      queue: ["t4"],
      history: ["t1", "t2"],
      repeatMode: "off",
      originalOrder: ["t1", "t2", "t3", "t4"],
    });

    const previous = slice.playPrevious();

    expect(previous).toBe("t2");
    expect(getQueueState()).toEqual({
      currentTrackId: "t2",
      queue: ["t3", "t4"],
      history: ["t1"],
      shuffleEnabled: false,
      repeatMode: "off",
      originalOrder: ["t1", "t2", "t3", "t4"],
    });
  });

  it("playNext keeps current track when repeat mode is one", () => {
    const { slice, getQueueState } = createHarness({
      currentTrackId: "t1",
      queue: ["t2"],
      history: [],
      repeatMode: "one",
      originalOrder: ["t1", "t2"],
    });

    const next = slice.playNext();

    expect(next).toBe("t1");
    expect(getQueueState()).toEqual({
      currentTrackId: "t1",
      queue: ["t2"],
      history: [],
      shuffleEnabled: false,
      repeatMode: "one",
      originalOrder: ["t1", "t2"],
    });
  });

  it("playNext restarts from original order when repeat mode is all", () => {
    const { slice, getQueueState } = createHarness({
      currentTrackId: "t3",
      queue: [],
      history: ["t1", "t2"],
      repeatMode: "all",
      originalOrder: ["t1", "t2", "t3"],
    });

    const next = slice.playNext();

    expect(next).toBe("t1");
    expect(getQueueState()).toEqual({
      currentTrackId: "t1",
      queue: ["t2", "t3"],
      history: [],
      shuffleEnabled: false,
      repeatMode: "all",
      originalOrder: ["t1", "t2", "t3"],
    });
  });

  it("toggleShuffle shuffles remaining queue and restores original order", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    const { slice, getQueueState } = createHarness({
      currentTrackId: "t1",
      queue: ["t2", "t3", "t4"],
      history: [],
      shuffleEnabled: false,
      repeatMode: "off",
      originalOrder: ["t1", "t2", "t3", "t4"],
    });

    slice.toggleShuffle();

    expect(getQueueState().shuffleEnabled).toBe(true);
    expect(getQueueState().queue).toEqual(["t3", "t4", "t2"]);

    randomSpy.mockRestore();
    slice.toggleShuffle();

    expect(getQueueState()).toEqual({
      currentTrackId: "t1",
      queue: ["t2", "t3", "t4"],
      history: [],
      shuffleEnabled: false,
      repeatMode: "off",
      originalOrder: ["t1", "t2", "t3", "t4"],
    });
  });

  it("playNextInQueue inserts immediately after current and addToQueue appends", () => {
    const { slice, getQueueState } = createHarness({
      currentTrackId: "t1",
      queue: ["t2", "t3"],
      history: [],
      shuffleEnabled: false,
      repeatMode: "off",
      originalOrder: ["t1", "t2", "t3"],
    });

    slice.playNextInQueue("t4");
    slice.addToQueue("t5");

    expect(getQueueState()).toEqual({
      currentTrackId: "t1",
      queue: ["t4", "t2", "t3", "t5"],
      history: [],
      shuffleEnabled: false,
      repeatMode: "off",
      originalOrder: ["t1", "t4", "t2", "t3", "t5"],
    });
  });

  it("insertIntoQueue inserts at the requested position and mirrors original order", () => {
    const { slice, getQueueState } = createHarness({
      currentTrackId: "t1",
      queue: ["t2", "t3"],
      history: [],
      shuffleEnabled: false,
      repeatMode: "off",
      originalOrder: ["t1", "t2", "t3"],
    });

    slice.insertIntoQueue("t4", 1);

    expect(getQueueState()).toEqual({
      currentTrackId: "t1",
      queue: ["t2", "t4", "t3"],
      history: [],
      shuffleEnabled: false,
      repeatMode: "off",
      originalOrder: ["t1", "t2", "t4", "t3"],
    });
  });

  it("moveInQueue reorders upcoming tracks and keeps original order aligned", () => {
    const { slice, getQueueState } = createHarness({
      currentTrackId: "t1",
      queue: ["t2", "t3", "t4"],
      history: [],
      shuffleEnabled: false,
      repeatMode: "off",
      originalOrder: ["t1", "t2", "t3", "t4"],
    });

    slice.moveInQueue(2, 0);

    expect(getQueueState()).toEqual({
      currentTrackId: "t1",
      queue: ["t4", "t2", "t3"],
      history: [],
      shuffleEnabled: false,
      repeatMode: "off",
      originalOrder: ["t1", "t4", "t2", "t3"],
    });
  });

  it("startQueue clamps invalid start indexes", () => {
    const trackIds: TrackId[] = ["t1", "t2", "t3"];
    const { slice, getQueueState } = createHarness();

    slice.startQueue(trackIds, 999);

    expect(getQueueState().currentTrackId).toBe("t3");
    expect(getQueueState().history).toEqual(["t1", "t2"]);
    expect(getQueueState().queue).toEqual([]);
  });
});
