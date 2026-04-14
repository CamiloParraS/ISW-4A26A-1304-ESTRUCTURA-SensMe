import { useStore } from "../store/index";
import type { Track } from "../types";

export function QueuePanel() {
    const isOpen = useStore((state) => state.isQueueOpen);
    const setQueueOpen = useStore((state) => state.setQueueOpen);
    const queueState = useStore((state) => state.queueState);
    const library = useStore((state) => state.library);
    const startQueue = useStore((state) => state.startQueue);
    const removeFromQueue = useStore((state) => state.removeFromQueue);
    const insertIntoQueue = useStore((state) => state.insertIntoQueue);

    const queuedTracks = queueState.queue
        .map((id) => library.get(id))
        .filter((track): track is Track => Boolean(track));

    const nowPlaying = queueState.currentTrackId
        ? library.get(queueState.currentTrackId)
        : null;

    return (
        <>
            <button
                type="button"
                className={`queue-panel-backdrop ${isOpen ? "queue-panel-backdrop--open" : ""}`}
                aria-hidden={!isOpen}
                tabIndex={isOpen ? 0 : -1}
                onClick={() => setQueueOpen(false)}
            />
            <aside
                className={`queue-panel ${isOpen ? "queue-panel--open" : ""}`}
                aria-label="Queue panel"
                aria-hidden={!isOpen}
            >
                <div className="queue-header">
                    <h2>Queue</h2>
                    <button type="button" onClick={() => setQueueOpen(false)} aria-label="Close queue">
                        Close
                    </button>
                </div>

                {/* {/* } */}
                <section>
                    <h3>Now Playing</h3>
                    {nowPlaying ? (
                        <div className="queue-item queue-item--current">
                            {nowPlaying.coverArtUrl ? (
                                <img src={nowPlaying.coverArtUrl} alt="" />
                            ) : (
                                <div className="queue-cover-placeholder" aria-hidden />
                            )}
                            <span>{nowPlaying.title}</span>
                            <span className="muted">{nowPlaying.artist}</span>
                        </div>
                    ) : (
                        <p className="muted">No active track.</p>
                    )}
                </section>

                {/* ── Next Up ─────────────────────────────────────────────────── */}
                <section>
                    <h3>Next Up ({queuedTracks.length})</h3>
                    <ul className="queue-list">
                        {queuedTracks.map((track, index) => (
                            <li
                                key={`${track.id}-${index}`}
                                className="queue-item"
                                onDoubleClick={() => {
                                    // Double-click to jump: rebuild the queue starting at this item.
                                    // We include the currently playing track at position 0 so history
                                    // is preserved correctly by startQueue.
                                    const currentAndQueue = queueState.currentTrackId
                                        ? [queueState.currentTrackId, ...queueState.queue]
                                        : [...queueState.queue];
                                    const startIndex = queueState.currentTrackId ? index + 1 : index;
                                    startQueue(currentAndQueue, startIndex);
                                }}
                            >
                                {track.coverArtUrl ? (
                                    <img src={track.coverArtUrl} alt="" />
                                ) : (
                                    <div className="queue-cover-placeholder" aria-hidden />
                                )}

                                <span>{track.title}</span>
                                <span className="muted">{track.artist}</span>

                                {/* ── Per-item queue actions ───────────────────── */}
                                <div className="queue-item-actions">
                                    {/* Move to top: O(1) front insert via insertIntoQueue(id, 0) */}
                                    {index > 0 && (
                                        <button
                                            type="button"
                                            className="queue-action-btn"
                                            aria-label={`Play ${track.title} next`}
                                            title="Play next"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Remove from its current position first, then
                                                // re-insert at the very front to keep queue behavior consistent.
                                                removeFromQueue(index);
                                                insertIntoQueue(track.id, 0);
                                            }}
                                        >
                                            ↑
                                        </button>
                                    )}

                                    {/* Remove from queue: O(n) positional remove */}
                                    <button
                                        type="button"
                                        className="queue-action-btn queue-action-btn--remove"
                                        aria-label={`Remove ${track.title} from queue`}
                                        title="Remove from queue"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFromQueue(index);
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            </aside>
        </>
    );
}