import { Fragment } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useStore } from "../store/index";
import type { Track } from "../types";
import { QueueDropIndicator } from "./QueueDropIndicator";
import { SortableQueueRow } from "./SortableQueueRow";

export function QueuePanel({ activeDragType }: { activeDragType?: string | null }) {
    const setQueueOpen = useStore((state) => state.setQueueOpen);
    const queueState = useStore((state) => state.queueState);
    const library = useStore((state) => state.library);
    const startQueue = useStore((state) => state.startQueue);
    const removeFromQueue = useStore((state) => state.removeFromQueue);

    const queuedTracks = queueState.queue
        .map((id) => library.get(id))
        .filter((track): track is Track => Boolean(track));

    const queueItemIds = queuedTracks.map((track, index) => `queue-item-${track.id}-${index}`);

    const nowPlaying = queueState.currentTrackId
        ? library.get(queueState.currentTrackId)
        : null;

    return (
        <div className="queue-panel">
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
                        <div className="queue-item-copy">
                            <span className="queue-item-title">{nowPlaying.title}</span>
                            <span className="muted">{nowPlaying.artist}</span>
                        </div>
                    </div>
                ) : (
                    <p className="muted">No active track.</p>
                )}
            </section>

            <section>
                <h3>Next Up ({queuedTracks.length})</h3>
                <SortableContext items={queueItemIds} strategy={verticalListSortingStrategy}>
                    <ul className="queue-list">
                        <QueueDropIndicator index={0} isLast={queuedTracks.length === 0} activeDragType={activeDragType} />
                        {queuedTracks.map((track, index) => (
                            <Fragment key={queueItemIds[index]}>
                                <SortableQueueRow
                                    queueItemId={queueItemIds[index]}
                                    track={track}
                                    index={index}
                                    onDoubleClick={() => {
                                        const currentAndQueue = queueState.currentTrackId
                                            ? [queueState.currentTrackId, ...queueState.queue]
                                            : [...queueState.queue];
                                        const startIndex = queueState.currentTrackId ? index + 1 : index;
                                        startQueue(currentAndQueue, startIndex);
                                    }}
                                    onRemove={() => removeFromQueue(index)}
                                />
                                <QueueDropIndicator index={index + 1} isLast={index + 1 === queuedTracks.length} activeDragType={activeDragType} />
                            </Fragment>
                        ))}
                    </ul>
                </SortableContext>
            </section>
        </div>
    );
}