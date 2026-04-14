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
import { LibraryView } from "../views/LibraryView";
import { PlaylistView } from "../views/PlaylistView";
import { PlaylistModals } from "./PlaylistModals";
import { PlaybackBar } from "./PlaybackBar";
import { QueuePanel } from "./QueuePanel";
import { Sidebar } from "./Sidebar";

export function Shell() {
    const view = useStore((state) => state.activeView);
    const library = useStore((state) => state.library);
    const playlists = useStore((state) => state.playlists);
    const addTrackToPlaylist = useStore((state) => state.addTrackToPlaylist);
    const reorderPlaylistTracks = useStore((state) => state.reorderPlaylistTracks);
    const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
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
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveTrackId(null);

        if (!over) {
            return;
        }

        const activeData = active.data.current as
            | {
                type?: string;
                playlistId?: string;
                trackId?: string;
            }
            | undefined;
        const overData = over.data.current as
            | {
                type?: string;
                playlistId?: string;
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
            <div className="shell">
                <Sidebar />
                <main className="main-content">
                    {view === "library" && <LibraryView />}
                    {view === "albums" && <AlbumsView />}
                    {view === "playlist" && <PlaylistView />}
                </main>
                <PlaybackBar />
                <QueuePanel />
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
