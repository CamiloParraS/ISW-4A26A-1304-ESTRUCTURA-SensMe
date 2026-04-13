import { useState, type MouseEvent } from "react";
import { useStore } from "../store";
import type { Track } from "../types";
import { formatDuration } from "../utils/format";
import { ContextMenu } from "./ContextMenu";

interface TrackRowProps {
    track: Track;
    index: number;
    onDoubleClick: () => void;
}

export function TrackRow({ track, index, onDoubleClick }: TrackRowProps) {
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
    const currentTrackId = useStore((state) => state.queueState.currentTrackId);
    const isPlaying = track.id === currentTrackId;

    function handleContextMenu(event: MouseEvent<HTMLTableRowElement>) {
        event.preventDefault();
        setMenuPosition({ x: event.clientX, y: event.clientY });
    }

    return (
        <>
            <tr
                className={`track-row ${isPlaying ? "track-row--playing" : ""}`}
                onDoubleClick={onDoubleClick}
                onContextMenu={handleContextMenu}
                aria-selected={isPlaying}
            >
                <td className="track-index">{isPlaying ? "PLAY" : index + 1}</td>
                <td className="track-title-cell">
                    {track.coverArtUrl && <img src={track.coverArtUrl} alt="" className="row-thumb" />}
                    <span
                        className="track-title"
                        aria-label={track.title}
                        title={track.title}
                        style={{
                            display: "inline-block",
                            maxWidth: 240,
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
                            maxWidth: 180,
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
                            maxWidth: 180,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            verticalAlign: "middle",
                        }}
                    >
                        {track.album}
                    </span>
                </td>
                <td className="text-muted tabular">
                    <span
                        className="cell-text"
                        aria-label={formatDuration(track.duration)}
                        title={formatDuration(track.duration)}
                        style={{
                            display: "inline-block",
                            maxWidth: 100,
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
                            maxWidth: 80,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            verticalAlign: "middle",
                        }}
                    >
                        {track.playCount}
                    </span>
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
