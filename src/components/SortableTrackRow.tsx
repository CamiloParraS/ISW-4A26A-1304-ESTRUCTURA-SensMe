import { DotsThreeOutlineVerticalIcon, WaveformIcon } from "@phosphor-icons/react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, type CSSProperties, type MouseEvent } from "react";
import { useStore } from "../store/index";
import type { PlaylistId, Track } from "../types";
import { formatDuration } from "../utils/format";
import { ContextMenu } from "./ContextMenu";

interface SortableTrackRowProps {
    playlistId: PlaylistId;
    track: Track;
    index: number;
    onDoubleClick: () => void;
}

export function SortableTrackRow({
    playlistId,
    track,
    index,
    onDoubleClick,
}: SortableTrackRowProps) {
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(
        null,
    );
    const currentTrackId = useStore((state) => state.queueState.currentTrackId);
    const isPlaying = currentTrackId === track.id;
    const titleMaxWidth = "30ch";
    const artistMaxWidth = "24ch";
    const albumMaxWidth = "24ch";

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({
            id: track.id,
            data: {
                type: "playlist-track",
                playlistId,
                trackId: track.id,
            },
        });

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.58 : 1,
        background: isDragging ? "var(--surface-2)" : undefined,
    };

    function handleContextMenu(event: MouseEvent<HTMLTableRowElement>) {
        event.preventDefault();
        setMenuPosition({ x: event.clientX, y: event.clientY });
    }

    function handleMenuButtonClick(event: MouseEvent<HTMLButtonElement>) {
        event.preventDefault();
        event.stopPropagation();
        const bounds = event.currentTarget.getBoundingClientRect();
        setMenuPosition({ x: bounds.right, y: bounds.bottom + 4 });
    }

    return (
        <>
            <tr
                ref={setNodeRef}
                className={`track-row ${isPlaying ? "track-row--playing" : ""} ${menuPosition ? "track-row--menu-open" : ""}`}
                style={style}
                onDoubleClick={onDoubleClick}
                onContextMenu={handleContextMenu}
                aria-selected={isPlaying}
            >
                <td
                    className="track-index drag-source-cell"
                    {...attributes}
                    {...listeners}
                    aria-label={`Drag ${track.title} to reorder playlist`}
                >
                    {isPlaying ? (
                        <>
                            <WaveformIcon size={16} weight="bold" aria-hidden />
                            <span className="sr-only">Playing</span>
                        </>
                    ) : (
                        index + 1
                    )}
                </td>
                <td className="track-title-cell">
                    {track.coverArtUrl && <img src={track.coverArtUrl} alt="" className="row-thumb" />}
                    <span
                        className="track-title"
                        aria-label={track.title}
                        title={track.title}
                        style={{
                            display: "inline-block",
                            maxWidth: titleMaxWidth,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            verticalAlign: "middle",
                        }}
                    >
                        {track.title}
                    </span>
                </td>
                <td className="text-secondary">
                    <span
                        className="cell-text"
                        aria-label={track.artist}
                        title={track.artist}
                        style={{
                            display: "inline-block",
                            maxWidth: artistMaxWidth,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            verticalAlign: "middle",
                        }}
                    >
                        {track.artist}
                    </span>
                </td>
                <td className="text-secondary">
                    <span
                        className="cell-text"
                        aria-label={track.album}
                        title={track.album}
                        style={{
                            display: "inline-block",
                            maxWidth: albumMaxWidth,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            verticalAlign: "middle",
                        }}
                    >
                        {track.album}
                    </span>
                </td>
                <td className="text-muted tabular">{formatDuration(track.duration)}</td>
                <td className="track-row-action-cell">
                    <button
                        type="button"
                        className="track-row-menu-btn"
                        aria-label={`Open actions for ${track.title}`}
                        aria-haspopup="menu"
                        aria-expanded={Boolean(menuPosition)}
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={handleMenuButtonClick}
                    >
                        <DotsThreeOutlineVerticalIcon size={16} weight="bold" aria-hidden />
                        <span className="sr-only">More actions</span>
                    </button>
                </td>
            </tr>
            {menuPosition && (
                <ContextMenu
                    track={track}
                    position={menuPosition}
                    playlistId={playlistId}
                    onClose={() => setMenuPosition(null)}
                />
            )}
        </>
    );
}
