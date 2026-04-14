import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import {
    PauseIcon as Pause,
    PlayIcon as Play,
    QueueIcon as Queue,
    RepeatOnceIcon as RepeatOne,
    RepeatIcon as Repeat,
    ShuffleIcon as Shuffle,
    SkipBackIcon as SkipBack,
    SkipForwardIcon as SkipForward,
} from "@phosphor-icons/react";
import { usePlaybackEngine } from "../hooks/usePlaybackEngine";
import { useStore } from "../store/index";
import { extractAccentColor } from "../utils/accentColor";

function formatTime(seconds: number): string {
    if (!Number.isFinite(seconds)) {
        return "0:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60)
        .toString()
        .padStart(2, "0");

    return `${minutes}:${remaining}`;
}

export function PlaybackBar() {
    const { state, play, pause, seek, setVolume, previous, next } = usePlaybackEngine();
    const [isDragging, setIsDragging] = useState(false);
    const isDraggingRef = useRef(false);
    const [seekTime, setSeekTime] = useState(0);
    const seekTimeRef = useRef(seekTime);
    const seekBarRef = useRef<HTMLInputElement | null>(null);

    const commitDragSeek = useCallback((finalTime?: number) => {
        if (!isDraggingRef.current) {
            return;
        }

        const time = finalTime ?? seekTimeRef.current;
        isDraggingRef.current = false;
        setIsDragging(false);
        seek(time);
    }, [seek]);

    // Pointer capture is used on the input element; no window-level pointerup listener required.

    const queueState = useStore((store) => store.queueState);
    const library = useStore((store) => store.library);
    const toggleShuffle = useStore((store) => store.toggleShuffle);
    const setRepeatMode = useStore((store) => store.setRepeatMode);
    const setQueueOpen = useStore((store) => store.setQueueOpen);
    const isQueueOpen = useStore((store) => store.isQueueOpen);

    const track = queueState.currentTrackId
        ? library.get(queueState.currentTrackId)
        : null;

    useEffect(() => {
        let active = true;

        if (!track?.coverArtUrl) {
            document.documentElement.style.setProperty("--accent", "#1db954");
            return;
        }

        void extractAccentColor(track.coverArtUrl).then((color) => {
            if (active) {
                document.documentElement.style.setProperty("--accent", color);
            }
        });

        return () => {
            active = false;
        };
    }, [track?.coverArtUrl]);

    const displayTime = isDragging ? seekTime : state.currentTime;
    const sliderValue = isDragging ? seekTime : Math.min(state.currentTime, state.duration || 1);
    const seekProgress = state.duration > 0 ? Math.min(100, (sliderValue / state.duration) * 100) : 0;
    const volumeProgress = Math.max(0, Math.min(100, state.volume * 100));

    const cycleRepeatMode = (): void => {
        const modes = ["off", "all", "one"] as const;
        const index = modes.indexOf(queueState.repeatMode);
        setRepeatMode(modes[(index + 1) % modes.length]);
    };

    const isRepeatActive = queueState.repeatMode !== "off";
    const repeatModeLabels: Record<typeof queueState.repeatMode, string> = {
        off: "desactivado",
        all: "todas",
        one: "una sola",
    };

    return (
        <div className="playback-bar" aria-label="Controles de reproducción">
            <div className="track-info">
                {track?.coverArtUrl ? (
                    <img src={track.coverArtUrl} alt="Portada del álbum" className="mini-cover" />
                ) : (
                    <div className="mini-cover mini-cover--placeholder" aria-hidden />
                )}
                <div className="track-text">
                    <span className="track-title">{track?.title ?? "Nada en reproducción"}</span>
                    <span className="track-artist">{track?.artist ?? "Selecciona una pista para comenzar"}</span>
                </div>
            </div>

            <div className="playback-bar__center">
                <div className="controls playback-bar__transport" aria-label="Controles de reproducción">
                    <button
                        type="button"
                        onClick={toggleShuffle}
                        className="transport-button"
                        aria-label="Aleatorio"
                        aria-pressed={queueState.shuffleEnabled}
                        data-active={queueState.shuffleEnabled}
                    >
                        <Shuffle aria-hidden />
                        <span className="sr-only">Aleatorio</span>
                    </button>

                    <button type="button" onClick={previous} className="transport-button" aria-label="Pista anterior">
                        <SkipBack aria-hidden />
                        <span className="sr-only">Pista anterior</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            if (state.isPlaying) {
                                pause();
                            } else {
                                void play();
                            }
                        }}
                        aria-label={state.isPlaying ? "Pausar" : "Reproducir"}
                        className="transport-button transport-button--primary"
                    >
                        {state.isPlaying ? <Pause aria-hidden /> : <Play aria-hidden />}
                        <span className="sr-only">{state.isPlaying ? "Pausar" : "Reproducir"}</span>
                    </button>

                    <button type="button" onClick={next} className="transport-button" aria-label="Pista siguiente">
                        <SkipForward aria-hidden />
                        <span className="sr-only">Pista siguiente</span>
                    </button>

                    <button
                        type="button"
                        onClick={cycleRepeatMode}
                        className="transport-button"
                        aria-label={`Modo de repetición: ${repeatModeLabels[queueState.repeatMode]}`}
                        aria-pressed={isRepeatActive}
                        data-active={isRepeatActive}
                    >
                        {queueState.repeatMode === "one" ? (
                            <RepeatOne aria-hidden />
                        ) : (
                            <Repeat aria-hidden />
                        )}
                        <span className="sr-only">Modo de repetición</span>
                    </button>
                </div>

                <div className="seek-row playback-bar__seek-row">
                    <span>{formatTime(displayTime)}</span>
                    <input
                        ref={seekBarRef}
                        type="range"
                        min={0}
                        max={state.duration || 1}
                        value={sliderValue}
                        style={{ "--seek-progress": `${seekProgress}%` } as CSSProperties}
                        onPointerDown={(event) => {
                            isDraggingRef.current = true;
                            setIsDragging(true);

                            try {
                                event.currentTarget.setPointerCapture(event.pointerId);
                            } catch {
                                // Some browsers can throw here. Safe to ignore.
                            }

                            const start = event.currentTarget.valueAsNumber;
                            seekTimeRef.current = start;
                            setSeekTime(start);
                        }}
                        onPointerUp={(event) => {
                            const finalValue = event.currentTarget.valueAsNumber;

                            try {
                                event.currentTarget.releasePointerCapture(event.pointerId);
                            } catch {
                                // Ignore if capture was already lost.
                            }

                            seekTimeRef.current = finalValue;
                            setSeekTime(finalValue);
                            commitDragSeek(finalValue);
                        }}
                        onPointerCancel={() => {
                            commitDragSeek();
                        }}
                        onInput={(event) => {
                            const next = (event.target as HTMLInputElement).valueAsNumber;
                            seekTimeRef.current = next;
                            setSeekTime(next);
                        }}
                        className="seek-bar"
                        aria-label="Posición de reproducción"
                    />
                    <span>{formatTime(state.duration)}</span>
                </div>
            </div>

            <div className="secondary-controls playback-bar__utility" aria-label="Controles auxiliares">
                <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={state.volume}
                    style={{ "--volume-progress": `${volumeProgress}%` } as CSSProperties}
                    onChange={(event) => setVolume(Number(event.target.value))}
                    aria-label="Volumen"
                    className="volume-bar"
                />

                <button
                    type="button"
                    onClick={() => setQueueOpen(!isQueueOpen)}
                    className="utility-button"
                    aria-label={isQueueOpen ? "Cerrar cola" : "Abrir cola"}
                    title={isQueueOpen ? "Cerrar cola" : "Abrir cola"}
                >
                    <Queue aria-hidden />
                    <span className="sr-only">Alternar cola</span>
                </button>
            </div>
        </div>
    );
}