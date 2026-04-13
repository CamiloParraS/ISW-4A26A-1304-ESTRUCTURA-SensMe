import { useEffect, useRef, useState } from "react";
import { usePlaybackEngine } from "../hooks/usePlaybackEngine";
import { useStore } from "../store";

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
    const [seekTime, setSeekTime] = useState(0);
    const seekTimeRef = useRef(seekTime);

    useEffect(() => {
        seekTimeRef.current = seekTime;
    }, [seekTime]);

    useEffect(() => {
        if (!isDragging) return;

        const onUp = () => {
            setIsDragging(false);
            seek(seekTimeRef.current);
        };

        window.addEventListener("pointerup", onUp);
        return () => window.removeEventListener("pointerup", onUp);
    }, [isDragging, seek]);

    const queueState = useStore((store) => store.queueState);
    const library = useStore((store) => store.library);
    const toggleShuffle = useStore((store) => store.toggleShuffle);
    const setRepeatMode = useStore((store) => store.setRepeatMode);
    const setQueueOpen = useStore((store) => store.setQueueOpen);

    const track = queueState.currentTrackId
        ? library.get(queueState.currentTrackId)
        : null;

    const displayTime = isDragging ? seekTime : state.currentTime;
    const sliderValue = isDragging ? seekTime : Math.min(state.currentTime, state.duration || 1);

    const cycleRepeatMode = (): void => {
        const modes = ["off", "all", "one"] as const;
        const index = modes.indexOf(queueState.repeatMode);
        setRepeatMode(modes[(index + 1) % modes.length]);
    };

    return (
        <div className="playback-bar" aria-label="Playback controls">
            <div className="track-info">
                {track?.coverArtUrl ? (
                    <img src={track.coverArtUrl} alt="Album cover" className="mini-cover" />
                ) : (
                    <div className="mini-cover mini-cover--placeholder" aria-hidden />
                )}
                <div className="track-text">
                    <span className="track-title">{track?.title ?? "Nothing playing"}</span>
                    <span className="track-artist">{track?.artist ?? "Select a track to begin"}</span>
                </div>
            </div>

            <div className="controls">
                <button type="button" onClick={previous} aria-label="Previous track">
                    Prev
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
                    aria-label={state.isPlaying ? "Pause" : "Play"}
                    className="play-pause"
                >
                    {state.isPlaying ? "Pause" : "Play"}
                </button>
                <button type="button" onClick={next} aria-label="Next track">
                    Next
                </button>
            </div>


            <div className="seek-row">
                <span>{formatTime(displayTime)}</span>
                <input
                    type="range"
                    min={0}
                    max={state.duration || 1}
                    value={sliderValue}
                    onPointerDown={() => {
                        setIsDragging(true);
                        setSeekTime(state.currentTime);
                    }}
                    onChange={(event) => {
                        const next = Number((event.target as HTMLInputElement).value);
                        if (isDragging) {
                            setSeekTime(next);
                            return;
                        }

                        seek(next);
                    }}
                    className="seek-bar"
                    aria-label="Seek position"
                />
                <span>{formatTime(state.duration)}</span>
            </div>

            <div className="secondary-controls">
                <button
                    type="button"
                    onClick={toggleShuffle}
                    className={queueState.shuffleEnabled ? "active" : ""}
                    aria-label="Shuffle"
                    aria-pressed={queueState.shuffleEnabled}
                >
                    Shuffle
                </button>

                <button type="button" onClick={cycleRepeatMode} aria-label="Repeat mode">
                    Repeat: {queueState.repeatMode}
                </button>

                <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={state.volume}
                    onChange={(event) => setVolume(Number(event.target.value))}
                    aria-label="Volume"
                    className="volume-bar"
                />

                <button type="button" onClick={() => setQueueOpen(true)} aria-label="Open queue">
                    Queue
                </button>
            </div>
        </div>
    );
}
