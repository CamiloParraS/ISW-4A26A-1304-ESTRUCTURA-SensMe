import { useEffect } from "react";
import {
  hydrateLibrary,
  loadPlaylists,
  loadQueueState,
  loadSerializedTracks,
  loadTheme,
} from "../persistence";
import { defaultQueueState, useStore } from "../store/index";
import { useToast } from "./useToast";

export function useStartup() {
  const addTracks = useStore((state) => state.addTracks);
  const setTheme = useStore((state) => state.setTheme);
  const setPlaylists = useStore((state) => state.setPlaylists);
  const setQueueState = useStore((state) => state.setQueueState);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setTheme(loadTheme());
      setPlaylists(loadPlaylists());
      setQueueState(loadQueueState() ?? defaultQueueState);

      const serialized = loadSerializedTracks();
      if (serialized.length === 0) {
        return;
      }

      const hydrated = await hydrateLibrary(serialized);
      if (cancelled) {
        return;
      }

      const skipped = serialized.length - hydrated.length;
      addTracks(hydrated);

      if (skipped > 0) {
        toast(
          `${skipped} track${skipped > 1 ? "s" : ""} could not be restored (files moved or deleted).`,
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
