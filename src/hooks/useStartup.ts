import { useEffect } from "react";
import {
  hydrateLibrary,
  loadPlaylists,
  loadQueueState,
  loadSerializedTracks,
  loadTheme,
} from "../persistence";
import { defaultQueueState, useStore } from "../store/index";
import type { QueueState } from "../types";
import { useToast } from "./useToast";

export function useStartup() {
  const addTracks = useStore((state) => state.addTracks);
  const setTheme = useStore((state) => state.setTheme);
  const setPlaylists = useStore((state) => state.setPlaylists);
  const setQueueState = useStore((state) => state.setQueueState);
  const setMissingSerializedTracks = useStore(
    (state) => state.setMissingSerializedTracks,
  );
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setTheme(loadTheme());
      setPlaylists(loadPlaylists());

      const serialized = loadSerializedTracks();
      if (serialized.length === 0) {
        setQueueState(loadQueueState() ?? defaultQueueState);
        return;
      }

      const hydrated = await hydrateLibrary(serialized);
      if (cancelled) {
        return;
      }

      const skipped = serialized.length - hydrated.length;
      addTracks(hydrated);

      const missing = serialized.filter(
        (s) => !hydrated.find((h) => h.id === s.id),
      );
      setMissingSerializedTracks(missing);

      // Restore persisted queue state only after library has been hydrated
      // so that `usePlaybackEngine` can find the current track and start playback.
      const persisted = loadQueueState();
      if (persisted) {
        const validIds = new Set(hydrated.map((t) => t.id));
        const cleanse = (arr: string[]) => arr.filter((id) => validIds.has(id));

        const cleaned: QueueState = {
          ...persisted,
          currentTrackId:
            persisted.currentTrackId && validIds.has(persisted.currentTrackId)
              ? persisted.currentTrackId
              : null,
          queue: cleanse(persisted.queue),
          history: cleanse(persisted.history),
          originalOrder: cleanse(persisted.originalOrder),
        };

        setQueueState(cleaned);
      } else {
        setQueueState(defaultQueueState);
      }

      if (skipped > 0) {
        toast(
          `${skipped} pista${skipped > 1 ? "s" : ""} ${
            skipped === 1 ? "no se pudo restaurar" : "no se pudieron restaurar"
          } (los archivos se movieron, se eliminaron o necesitan reautorización).`,
          "info",
        );
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, [addTracks, setPlaylists, setQueueState, setTheme, toast]);
}
