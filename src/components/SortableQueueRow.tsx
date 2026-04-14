import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type CSSProperties, type MouseEvent } from "react";
import type { Track } from "../types";

interface SortableQueueRowProps {
    queueItemId: string;
    track: Track;
    index: number;
    onDoubleClick: () => void;
    onRemove: () => void;
}

export function SortableQueueRow({
    queueItemId,
    track,
    index,
    onDoubleClick,
    onRemove,
}: SortableQueueRowProps) {
    const { attributes, listeners, setNodeRef: setSortableNodeRef, transform, transition, isDragging } =
        useSortable({
            id: queueItemId,
            data: {
                type: "queue-track",
                trackId: track.id,
                index,
            },
        });

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.58 : 1,
        background: isDragging ? "var(--surface-2)" : undefined,
    };

    function stopPointerPropagation(event: MouseEvent<HTMLButtonElement>) {
        event.stopPropagation();
    }

    return (
        <li
            ref={setSortableNodeRef}
            className="queue-item queue-item--sortable"
            style={style}
            onDoubleClick={onDoubleClick}
            {...attributes}
            {...listeners}
        >
            {track.coverArtUrl ? (
                <img src={track.coverArtUrl} alt="" className="queue-cover" />
            ) : (
                <div className="queue-cover-placeholder" aria-hidden />
            )}

            <div className="queue-item-copy">
                <span className="queue-item-title">{track.title}</span>
                <span className="muted queue-item-artist" title={track.artist}>{track.artist}</span>
            </div>

            <div className="queue-item-actions">
                <button
                    type="button"
                    className="queue-action-btn queue-action-btn--remove"
                    aria-label={`Remove ${track.title} from queue`}
                    title="Remove from queue"
                    onPointerDown={stopPointerPropagation}
                    onClick={onRemove}
                >
                    ✕
                </button>
            </div>
        </li>
    );
}