import { useStore } from "../store";
import type { Track } from "../types";

export function QueuePanel() {
    const isOpen = useStore((state) => state.isQueueOpen);
    const setQueueOpen = useStore((state) => state.setQueueOpen);
    const queueState = useStore((state) => state.queueState);
    const library = useStore((state) => state.library);
    const startQueue = useStore((state) => state.startQueue);

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

                <section>
                    <h3>Now Playing</h3>
                    {nowPlaying ? (
                        <div className="queue-item queue-item--current">
                            {nowPlaying.coverArtUrl ? (
                                <img src={nowPlaying.coverArtUrl} alt="" />
                            ) : (
                                <div className="queue-cover-placeholder" aria-hidden />
                            )}
                            {/* Matches the flat structure */}
                            <span>{nowPlaying.title}</span>
                            <span className="muted">{nowPlaying.artist}</span>
                        </div>
                    ) : (
                        <p className="muted">No active track.</p>
                    )}
                </section>

                <section>
                    <h3>Next Up ({queuedTracks.length})</h3>
                    <ul className="queue-list">
                        {queuedTracks.map((track, index) => (
                            <li
                                key={`${track.id}-${index}`}
                                className="queue-item"
                                onDoubleClick={() => {
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

                                {/* Removed 'queue-meta' div to match Now Playing structure */}
                                <span>
                                    {track.title}
                                </span>
                                <span className="muted">{track.artist}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            </aside>
        </>
    );
}