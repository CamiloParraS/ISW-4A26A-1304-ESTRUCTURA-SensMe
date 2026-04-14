import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    type DragEndEvent,
    type DragStartEvent,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState } from "react";
import { useToast } from "../hooks/useToast";
import { useStore } from "../store/index";
import { AlbumsView } from "../views/AlbumsView";
import { LibraryView } from "../views/LibraryView.tsx";
import { SongsView } from "../views/SongsView.tsx";
import { PlaylistView } from "../views/PlaylistView";
import { PlaylistModals } from "./PlaylistModals";
import { PlaybackBar } from "./PlaybackBar";
import { QueuePanel } from "./QueuePanel";
import { Sidebar } from "./Sidebar";

export function Shell() {
    const view = useStore((state) => state.activeView);
    const library = useStore((state) => state.library);
    const playlists = useStore((state) => state.playlists);
    const queueState = useStore((state) => state.queueState);
    const isQueueOpen = useStore((state) => state.isQueueOpen);
    const addTrackToPlaylist = useStore((state) => state.addTrackToPlaylist);
    const reorderPlaylistTracks = useStore((state) => state.reorderPlaylistTracks);
    const insertIntoQueue = useStore((state) => state.insertIntoQueue);
    const moveInQueue = useStore((state) => state.moveInQueue);
    const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
    const [activeDragType, setActiveDragType] = useState<string | null>(null);
    const { toast } = useToast();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    function handleDragStart(event: DragStartEvent) {
        const dragData = event.active.data.current as
            | { trackId?: string }
            | undefined;
        setActiveTrackId(dragData?.trackId ?? String(event.active.id));
        setActiveDragType((event.active.data.current as any)?.type ?? null);
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveTrackId(null);
        setActiveDragType(null);

        if (!over) {
            return;
        }

        const activeData = active.data.current as
            | {
                type?: string;
                playlistId?: string;
                trackId?: string;
                index?: number;
            }
            | undefined;
        const overData = over.data.current as
            | {
                type?: string;
                playlistId?: string;
                index?: number;
            }
            | undefined;

        if (
            activeData?.type === "library-track" &&
            overData?.type === "playlist-drop" &&
            overData.playlistId
        ) {
            const trackId = activeData.trackId ?? String(active.id);
            const result = addTrackToPlaylist(overData.playlistId, trackId);
            const playlist = playlists.find((item) => item.id === overData.playlistId);
            const track = library.get(trackId);

            if (result === "already-in-playlist") {
                toast(
                    `${track?.title ?? "Track"} is already in ${playlist?.name ?? "this playlist"}.`,
                    "info",
                );
            }

            if (result === "playlist-not-found") {
                toast("Could not add track because the playlist no longer exists.", "error");
            }

            return;
        }

        if ((activeData?.type === "library-track" || activeData?.type === "playlist-track") && overData?.type === "queue-insert") {
            const trackId = activeData.trackId ?? String(active.id);
            if (typeof overData.index === "number") {
                insertIntoQueue(trackId, overData.index);
            }
            return;
        }

        // Allow dropping a library or playlist track directly onto a queue row
        if ((activeData?.type === "library-track" || activeData?.type === "playlist-track") && overData?.type === "queue-track") {
            const trackId = activeData.trackId ?? String(active.id);
            if (typeof overData.index === "number") {
                insertIntoQueue(trackId, overData.index);
            }
            return;
        }

        if ((activeData?.type === "library-track" || activeData?.type === "playlist-track") && overData?.type === "queue-drop") {
            const trackId = activeData.trackId ?? String(active.id);
            insertIntoQueue(trackId, queueState.queue.length);
            return;
        }

        if (activeData?.type === "queue-track" && overData?.type === "queue-insert") {
            if (typeof activeData.index === "number" && typeof overData.index === "number") {
                moveInQueue(activeData.index, overData.index);
            }
            return;
        }

        // Reorder when dropping a queue item onto another queue item
        if (activeData?.type === "queue-track" && overData?.type === "queue-track") {
            if (typeof activeData.index === "number" && typeof overData.index === "number") {
                moveInQueue(activeData.index, overData.index);
            }
            return;
        }

        if (activeData?.type === "queue-track" && overData?.type === "queue-drop") {
            if (typeof activeData.index === "number") {
                moveInQueue(activeData.index, queueState.queue.length);
            }
            return;
        }

        if (activeData?.type !== "playlist-track" || active.id === over.id) {
            return;
        }

        const playlistId = activeData.playlistId;
        if (!playlistId) {
            return;
        }

        const playlist = playlists.find((item) => item.id === playlistId);
        if (!playlist) {
            return;
        }

        const fromIdx = playlist.trackIds.indexOf(String(active.id));
        const toIdx = playlist.trackIds.indexOf(String(over.id));

        if (fromIdx !== -1 && toIdx !== -1) {
            reorderPlaylistTracks(playlistId, fromIdx, toIdx);
        }
    }

    const activeTrack = activeTrackId ? library.get(activeTrackId) : null;

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveTrackId(null)}
        >
            <div className={`shell ${isQueueOpen ? "shell--queue-open" : ""}`}>
                <Sidebar />
                <main className="main-content">
                    {view === "songs" && <SongsView />}
                    {view === "library" && <LibraryView />}
                    {view === "albums" && <AlbumsView />}
                    {view === "playlist" && <PlaylistView />}
                </main>
                <aside
                    className={`queue-sidebar ${isQueueOpen ? "queue-sidebar--open" : ""}`}
                    aria-label="Queue panel"
                    aria-hidden={!isQueueOpen}
                >
                    <QueuePanel activeDragType={activeDragType} />
                </aside>
                <PlaybackBar />
                <PlaylistModals />
            </div>
            <DragOverlay>
                {activeTrack && (
                    <div className="drag-ghost">
                        <strong>{activeTrack.title}</strong>
                        <span>{activeTrack.artist}</span>
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}
