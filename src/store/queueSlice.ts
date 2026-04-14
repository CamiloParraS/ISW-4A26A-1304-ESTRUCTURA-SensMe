import { toChainBuffer } from "../ds";
import { shuffled } from "../ds";
import { saveQueueState } from "../persistence";
import type { QueueState, RepeatMode, TrackId } from "../types";

export interface QueueSlice {
  queueState: QueueState;
  setQueueState: (queueState: QueueState) => void;
  startQueue: (trackIds: TrackId[], startIndex: number) => void;
  playNext: () => TrackId | null;
  playPrevious: () => TrackId | null;
  /** Append a track to the very end of the upcoming queue. */
  addToQueue: (trackId: TrackId) => void;
  /** Insert a track so it plays immediately after the current track. */
  playNextInQueue: (trackId: TrackId) => void;
  insertIntoQueue: (trackId: TrackId, index: number) => void;
  moveInQueue: (fromIdx: number, toIdx: number) => void;
  removeFromQueue: (index: number) => void;
  toggleShuffle: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
}

const EMPTY_QUEUE_STATE: QueueState = {
  currentTrackId: null,
  queue: [],
  history: [],
  shuffleEnabled: false,
  repeatMode: "off",
  originalOrder: [],
};

function normalizeStartIndex(trackIds: TrackId[], startIndex: number): number {
  if (trackIds.length === 0) return 0;
  return Math.min(Math.max(startIndex, 0), trackIds.length - 1);
}

function nextQueueState(
  set: (partial: { queueState: QueueState }) => void,
  queueState: QueueState,
): void {
  saveQueueState(queueState);
  set({ queueState });
}

function splitOriginalOrder(queueState: QueueState): {
  prefix: TrackId[];
  upcoming: TrackId[];
} {
  const currentIndex = queueState.currentTrackId
    ? queueState.originalOrder.indexOf(queueState.currentTrackId)
    : -1;

  if (currentIndex >= 0) {
    return {
      prefix: queueState.originalOrder.slice(0, currentIndex + 1),
      upcoming: queueState.originalOrder.slice(currentIndex + 1),
    };
  }

  return {
    prefix: [],
    upcoming: [...queueState.originalOrder],
  };
}

function updateOriginalOrder(
  queueState: QueueState,
  nextUpcoming: TrackId[],
): TrackId[] {
  const { prefix } = splitOriginalOrder(queueState);
  return [...prefix, ...nextUpcoming];
}

function insertAt<T>(items: T[], index: number, item: T): T[] {
  const nextItems = [...items];
  const targetIndex = Math.min(Math.max(index, 0), nextItems.length);
  nextItems.splice(targetIndex, 0, item);
  return nextItems;
}

function removeAt<T>(items: T[], index: number): T[] {
  if (index < 0 || index >= items.length) {
    return items;
  }

  const nextItems = [...items];
  nextItems.splice(index, 1);
  return nextItems;
}

function moveAt<T>(items: T[], fromIdx: number, toIdx: number): T[] {
  if (fromIdx < 0 || fromIdx >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIdx, 1);

  if (movedItem === undefined) {
    return items;
  }

  const targetIndex = Math.min(Math.max(toIdx, 0), nextItems.length);
  nextItems.splice(targetIndex, 0, movedItem);
  return nextItems;
}

export function createQueueSlice<T extends { queueState: QueueState }>(
  set: (partial: { queueState: QueueState }) => void,
  get: () => T,
): QueueSlice {
  return {
    queueState: EMPTY_QUEUE_STATE,

    setQueueState: (queueState) => {
      nextQueueState(set, queueState);
    },

    startQueue: (trackIds, startIndex) => {
      const { queueState } = get();

      if (trackIds.length === 0) {
        nextQueueState(set, {
          ...queueState,
          currentTrackId: null,
          queue: [],
          history: [],
          originalOrder: [],
        });
        return;
      }

      const normalizedStart = normalizeStartIndex(trackIds, startIndex);
      const upcoming = trackIds.slice(normalizedStart + 1);

      const next: QueueState = {
        currentTrackId: trackIds[normalizedStart] ?? null,
        queue: queueState.shuffleEnabled ? shuffled(upcoming) : upcoming,
        history: trackIds.slice(0, normalizedStart),
        shuffleEnabled: queueState.shuffleEnabled,
        repeatMode: queueState.repeatMode,
        originalOrder: [...trackIds],
      };

      nextQueueState(set, next);
    },

    playNext: () => {
      const { queueState } = get();
      const { queue, history, currentTrackId, repeatMode, originalOrder } =
        queueState;

      if (repeatMode === "one") {
        return currentTrackId;
      }

      if (queue.length === 0) {
        if (repeatMode === "all" && originalOrder.length > 0) {
          const restarted = queueState.shuffleEnabled
            ? shuffled([...originalOrder])
            : [...originalOrder];

          const nextTrack = restarted[0] ?? null;
          nextQueueState(set, {
            ...queueState,
            currentTrackId: nextTrack,
            queue: restarted.slice(1),
            history: [],
          });
          return nextTrack;
        }

        nextQueueState(set, { ...queueState, currentTrackId: null });
        return null;
      }

      const list = toChainBuffer(queue);
      const nextTrack = list.takeStart() ?? null;
      if (!nextTrack) return null;

      nextQueueState(set, {
        ...queueState,
        currentTrackId: nextTrack,
        queue: list.exportItems(),
        history: currentTrackId ? [...history, currentTrackId] : history,
      });

      return nextTrack;
    },

    playPrevious: () => {
      const { queueState } = get();
      const { history, queue, currentTrackId } = queueState;

      if (history.length === 0) {
        return currentTrackId;
      }

      const prev = history[history.length - 1];
      const newHistory = history.slice(0, -1);

      const list = toChainBuffer(queue);
      if (currentTrackId) {
        list.addStart(currentTrackId);
      }

      nextQueueState(set, {
        ...queueState,
        currentTrackId: prev,
        queue: list.exportItems(),
        history: newHistory,
      });

      return prev;
    },

    addToQueue: (trackId) => {
      const { queueState } = get();
      const nextQueue = [...queueState.queue, trackId];

      nextQueueState(set, {
        ...queueState,
        queue: nextQueue,
        originalOrder: updateOriginalOrder(queueState, nextQueue),
      });
    },

    playNextInQueue: (trackId) => {
      const { queueState } = get();
      const nextQueue = [trackId, ...queueState.queue];

      nextQueueState(set, {
        ...queueState,
        queue: nextQueue,
        originalOrder: updateOriginalOrder(queueState, nextQueue),
      });
    },

    insertIntoQueue: (trackId, index) => {
      const { queueState } = get();
      const nextQueue = insertAt(queueState.queue, index, trackId);

      nextQueueState(set, {
        ...queueState,
        queue: nextQueue,
        originalOrder: updateOriginalOrder(queueState, nextQueue),
      });
    },

    moveInQueue: (fromIdx, toIdx) => {
      const { queueState } = get();
      const nextQueue = moveAt(queueState.queue, fromIdx, toIdx);

      if (nextQueue === queueState.queue) {
        return;
      }

      nextQueueState(set, {
        ...queueState,
        queue: nextQueue,
        originalOrder: updateOriginalOrder(queueState, nextQueue),
      });
    },

    removeFromQueue: (index) => {
      const { queueState } = get();

      if (index < 0 || index >= queueState.queue.length) return;

      const nextQueue = removeAt(queueState.queue, index);

      if (nextQueue === queueState.queue) {
        return;
      }

      nextQueueState(set, {
        ...queueState,
        queue: nextQueue,
        originalOrder: updateOriginalOrder(queueState, nextQueue),
      });
    },

    toggleShuffle: () => {
      const { queueState } = get();
      const { shuffleEnabled, queue, originalOrder, currentTrackId } =
        queueState;

      if (!shuffleEnabled) {
        const list = toChainBuffer(queue);
        const shuffledArray = shuffled(list.exportItems());
        nextQueueState(set, {
          ...queueState,
          shuffleEnabled: true,
          queue: shuffledArray,
        });
        return;
      }

      const currentIndex = currentTrackId
        ? originalOrder.indexOf(currentTrackId)
        : -1;
      const restored =
        currentIndex >= 0
          ? originalOrder.slice(currentIndex + 1)
          : [...originalOrder];

      nextQueueState(set, {
        ...queueState,
        shuffleEnabled: false,
        queue: restored,
      });
    },

    setRepeatMode: (repeatMode) => {
      const { queueState } = get();
      nextQueueState(set, { ...queueState, repeatMode });
    },
  };
}
