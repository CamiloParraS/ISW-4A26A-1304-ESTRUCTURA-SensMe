import { Deque, shuffled } from "../ds";
import { saveQueueState } from "../persistence";
import type { QueueState, RepeatMode, TrackId } from "../types";

export interface QueueSlice {
  queueState: QueueState;
  setQueueState: (queueState: QueueState) => void;
  startQueue: (trackIds: TrackId[], startIndex: number) => void;
  playNext: () => TrackId | null;
  playPrevious: () => TrackId | null;
  addToQueue: (trackId: TrackId) => void;
  playNextInQueue: (trackId: TrackId) => void;
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

function toDeque<T>(items: T[]): Deque<T> {
  const deque = new Deque<T>();

  for (const item of items) {
    deque.pushBack(item);
  }

  return deque;
}

function normalizeStartIndex(trackIds: TrackId[], startIndex: number): number {
  if (trackIds.length === 0) {
    return 0;
  }

  return Math.min(Math.max(startIndex, 0), trackIds.length - 1);
}

function nextQueueState(
  set: (partial: { queueState: QueueState }) => void,
  queueState: QueueState,
): void {
  saveQueueState(queueState);
  set({ queueState });
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

        nextQueueState(set, {
          ...queueState,
          currentTrackId: null,
        });
        return null;
      }

      const deque = toDeque(queue);
      const nextTrack = deque.popFront() ?? null;
      if (!nextTrack) {
        return null;
      }

      nextQueueState(set, {
        ...queueState,
        currentTrackId: nextTrack,
        queue: deque.toArray(),
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
      const deque = toDeque(queue);

      if (currentTrackId) {
        deque.pushFront(currentTrackId);
      }

      nextQueueState(set, {
        ...queueState,
        currentTrackId: prev,
        queue: deque.toArray(),
        history: newHistory,
      });

      return prev;
    },

    addToQueue: (trackId) => {
      const { queueState } = get();
      const deque = toDeque(queueState.queue);
      deque.pushBack(trackId);

      nextQueueState(set, {
        ...queueState,
        queue: deque.toArray(),
        originalOrder: [...queueState.originalOrder, trackId],
      });
    },

    playNextInQueue: (trackId) => {
      const { queueState } = get();
      const deque = toDeque(queueState.queue);
      deque.pushFront(trackId);

      const currentIndex = queueState.currentTrackId
        ? queueState.originalOrder.indexOf(queueState.currentTrackId)
        : -1;
      const nextOriginalOrder =
        currentIndex >= 0
          ? [
              ...queueState.originalOrder.slice(0, currentIndex + 1),
              trackId,
              ...queueState.originalOrder.slice(currentIndex + 1),
            ]
          : [trackId, ...queueState.originalOrder];

      nextQueueState(set, {
        ...queueState,
        queue: deque.toArray(),
        originalOrder: nextOriginalOrder,
      });
    },

    toggleShuffle: () => {
      const { queueState } = get();
      const { shuffleEnabled, queue, originalOrder, currentTrackId } =
        queueState;

      if (!shuffleEnabled) {
        nextQueueState(set, {
          ...queueState,
          shuffleEnabled: true,
          queue: shuffled(queue),
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
      nextQueueState(set, {
        ...queueState,
        repeatMode,
      });
    },
  };
}
