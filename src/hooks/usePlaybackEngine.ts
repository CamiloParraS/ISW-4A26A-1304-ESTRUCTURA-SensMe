import { useEffect, useRef, useState } from "react";
import { audioEngine } from "../playback/AudioEngine";
import { useStore } from "../store/index";
import { useToast } from "./useToast";

export interface PlaybackState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
}

export function usePlaybackEngine() {
  const library = useStore((state) => state.library);
  const currentTrackId = useStore((state) => state.queueState.currentTrackId);
  const repeatMode = useStore((state) => state.queueState.repeatMode);
  const playNext = useStore((state) => state.playNext);
  const updateTrack = useStore((state) => state.updateTrack);
  const { toast } = useToast();

  const [state, setState] = useState<PlaybackState>({
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    volume: 1,
  });

  const previousTrackIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentTrackId) {
      previousTrackIdRef.current = null;
      return;
    }

    if (currentTrackId === previousTrackIdRef.current) {
      return;
    }

    previousTrackIdRef.current = currentTrackId;
    let cancelled = false;

    const track = library.get(currentTrackId);
    if (!track) return;

    void (async () => {
      try {
        const file = await track.fileHandle.getFile();
        if (cancelled) return;
        await audioEngine.load(file);
        if (cancelled) return;
        await audioEngine.play();

        updateTrack(currentTrackId, {
          playCount: (track.playCount ?? 0) + 1,
          lastPlayed: Date.now(),
        });
      } catch {
        if (!cancelled) {
          toast(`File not found: "${track.title}"`, "error");
          playNext();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentTrackId, library, playNext, toast, updateTrack]);

  const playbackState = currentTrackId
    ? state
    : { ...state, currentTime: 0, duration: 0, isPlaying: false };

  useEffect(() => {
    audioEngine.setLoop(repeatMode === "one");
  }, [repeatMode]);

  useEffect(() => {
    return audioEngine.on((event, data) => {
      switch (event) {
        case "play":
          setState((current) => ({ ...current, isPlaying: true }));
          break;
        case "pause":
          setState((current) => ({ ...current, isPlaying: false }));
          break;
        case "timeupdate":
          setState((current) => ({ ...current, currentTime: data ?? 0 }));
          break;
        case "durationchange":
          setState((current) => ({ ...current, duration: data ?? 0 }));
          break;
        case "volumechange":
          setState((current) => ({ ...current, volume: data ?? 1 }));
          break;
        case "ended":
          if (repeatMode !== "one") {
            playNext();
          }
          break;
        case "error":
          toast("Playback error on current track", "error");
          playNext();
          break;
        default:
          break;
      }
    });
  }, [playNext, repeatMode, toast]);

  return {
    state: playbackState,
    play: () => audioEngine.play(),
    pause: () => audioEngine.pause(),
    seek: (time: number) => audioEngine.seek(time),
    setVolume: (volume: number) => {
      audioEngine.setVolume(volume);
      setState((current) => ({ ...current, volume }));
    },
    previous: () => {
      if (audioEngine.currentTime > 3) {
        audioEngine.seek(0);
        return;
      }

      const store = useStore.getState();
      const previousTrackId = store.playPrevious();
      if (!previousTrackId) {
        audioEngine.seek(0);
      }
    },
    next: () => playNext(),
  };
}
