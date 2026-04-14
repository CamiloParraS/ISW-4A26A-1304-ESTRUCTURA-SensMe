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

function spliceAfterCurrent(
  originalOrder: TrackId[],
  currentTrackId: TrackId | null,
  trackId: TrackId,
): TrackId[] {
  const currentIndex = currentTrackId
    ? originalOrder.indexOf(currentTrackId)
    : -1;

  if (currentIndex >= 0) {
    return [
      ...originalOrder.slice(0, currentIndex + 1),
      trackId,
      ...originalOrder.slice(currentIndex + 1),
    ];
  }

  return [trackId, ...originalOrder];
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

      // repeat-one: stay on the same track
      if (repeatMode === "one") {
        return currentTrackId;
      }

      if (queue.length === 0) {
        // repeat-all: rebuild the queue from originalOrder
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

        // queue exhausted, nothing to play
        nextQueueState(set, { ...queueState, currentTrackId: null });
        return null;
      }

      // Normal advance: consume the first queued item.
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
      const list = toChainBuffer(queueState.queue);
      list.addEnd(trackId); // O(1)

      nextQueueState(set, {
        ...queueState,
        queue: list.exportItems(),
        originalOrder: [...queueState.originalOrder, trackId],
      });
    },

    playNextInQueue: (trackId) => {
      const { queueState } = get();
      const list = toChainBuffer(queueState.queue);
      list.addStart(trackId); // O(1)

      nextQueueState(set, {
        ...queueState,
        queue: list.exportItems(),
        originalOrder: spliceAfterCurrent(
          queueState.originalOrder,
          queueState.currentTrackId,
          trackId,
        ),
      });
    },

    insertIntoQueue: (trackId, index) => {
      const { queueState } = get();
      const list = toChainBuffer(queueState.queue);
      list.addAt(index, trackId); // O(n) walk to position

      // Mirror in originalOrder: insertion at index 0 is "play next",
      // any other index sits that many positions ahead in the remaining queue.
      const nextOriginalOrder =
        index === 0
          ? spliceAfterCurrent(
              queueState.originalOrder,
              queueState.currentTrackId,
              trackId,
            )
          : [...queueState.originalOrder, trackId]; // simplest safe fallback for mid-queue inserts

      nextQueueState(set, {
        ...queueState,
        queue: list.exportItems(),
        originalOrder: nextOriginalOrder,
      });
    },

    removeFromQueue: (index) => {
      const { queueState } = get();

      // Guard: ignore out-of-range indices silently
      if (index < 0 || index >= queueState.queue.length) return;

      const list = toChainBuffer(queueState.queue);
      const removedTrack = list.takeAt(index); // O(n) walk

      if (removedTrack === undefined) return; // shouldn't happen given the guard

      // Also prune from originalOrder. We only remove the first occurrence to
      // handle edge-cases where the same track appears multiple times.
      const orderIndex = queueState.originalOrder.indexOf(removedTrack);
      const nextOriginalOrder =
        orderIndex >= 0
          ? [
              ...queueState.originalOrder.slice(0, orderIndex),
              ...queueState.originalOrder.slice(orderIndex + 1),
            ]
          : queueState.originalOrder;

      nextQueueState(set, {
        ...queueState,
        queue: list.exportItems(),
        originalOrder: nextOriginalOrder,
      });
    },

    toggleShuffle: () => {
      const { queueState } = get();
      const { shuffleEnabled, queue, originalOrder, currentTrackId } =
        queueState;

      if (!shuffleEnabled) {
        // Shuffle the current queue in place using a temporary buffer.
        const list = toChainBuffer(queue);
        const shuffledArray = shuffled(list.exportItems());
        nextQueueState(set, {
          ...queueState,
          shuffleEnabled: true,
          queue: shuffledArray,
        });
        return;
      }

      // Restore original order starting after the current track
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
