import { useEffect, type CSSProperties } from "react";
import { useStore } from "../store";
import type { Track } from "../types";

interface ContextMenuProps {
    track: Track;
    position: { x: number; y: number };
    onClose: () => void;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export function ContextMenu({ track, position, onClose }: ContextMenuProps) {
    const startQueue = useStore((state) => state.startQueue);
    const playNextInQueue = useStore((state) => state.playNextInQueue);
    const addToQueue = useStore((state) => state.addToQueue);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        const onPointerDown = () => onClose();

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("pointerdown", onPointerDown);

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("pointerdown", onPointerDown);
        };
    }, [onClose]);

    const style: CSSProperties = {
        top: clamp(position.y, 12, window.innerHeight - 190),
        left: clamp(position.x, 12, window.innerWidth - 220),
    };

    return (
        <div
            className="context-menu"
            role="menu"
            style={style}
            onPointerDown={(event) => event.stopPropagation()}
        >
            <button
                type="button"
                className="context-item"
                onClick={() => {
                    startQueue([track.id], 0);
                    onClose();
                }}
            >
                Play now
            </button>
            <button
                type="button"
                className="context-item"
                onClick={() => {
                    playNextInQueue(track.id);
                    onClose();
                }}
            >
                Play next
            </button>
            <button
                type="button"
                className="context-item"
                onClick={() => {
                    addToQueue(track.id);
                    onClose();
                }}
            >
                Add to queue end
            </button>
        </div>
    );
}
