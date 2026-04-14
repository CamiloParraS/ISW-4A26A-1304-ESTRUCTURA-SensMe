import { useState, type MouseEvent } from "react";
import { useDraggable } from "@dnd-kit/core";
import { useStore } from "../store/index";
import type { Track } from "../types";
import { formatDuration } from "../utils/format";
import { ContextMenu } from "./ContextMenu";
import { DotsThreeOutlineVerticalIcon, WaveformIcon } from "@phosphor-icons/react";

interface TrackRowProps {
    track: Track;
    index: number;
    onDoubleClick: () => void;
    showAlbum?: boolean;
}

export function TrackRow({ track, index, onDoubleClick, showAlbum = true }: TrackRowProps) {
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
    const currentTrackId = useStore((state) => state.queueState.currentTrackId);
    const isPlaying = track.id === currentTrackId;
    const titleMaxWidth = showAlbum ? "30ch" : "24ch";
    const artistMaxWidth = showAlbum ? "24ch" : "18ch";
    const albumMaxWidth = "24ch";
    const durationMaxWidth = "7ch";
    const playCountMaxWidth = "6ch";
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: track.id,
        data: {
            type: "library-track",
            trackId: track.id,
        },
    });

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
                style={isDragging ? { opacity: 0.55 } : undefined}
                onDoubleClick={onDoubleClick}
                onContextMenu={handleContextMenu}
                aria-selected={isPlaying}
            >
                <td
                    className="track-index drag-source-cell"
                    {...attributes}
                    {...listeners}
                    aria-label={`Drag ${track.title} to a playlist`}
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
                {showAlbum && (
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
                )}
                <td className="text-muted tabular">
                    <span
                        className="cell-text"
                        aria-label={formatDuration(track.duration)}
                        title={formatDuration(track.duration)}
                        style={{
                            display: "inline-block",
                            maxWidth: durationMaxWidth,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            verticalAlign: "middle",
                        }}
                    >
                        {formatDuration(track.duration)}
                    </span>
                </td>
                <td className="text-muted tabular">
                    <span
                        className="cell-text"
                        aria-label={String(track.playCount)}
                        title={String(track.playCount)}
                        style={{
                            display: "inline-block",
                            maxWidth: playCountMaxWidth,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            verticalAlign: "middle",
                        }}
                    >
                        {track.playCount}
                    </span>
                </td>
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
                    onClose={() => setMenuPosition(null)}
                />
            )}
        </>
    );
}
