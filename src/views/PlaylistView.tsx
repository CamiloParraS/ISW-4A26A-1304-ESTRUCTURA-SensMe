import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { PlaylistArtMosaic } from "../components/PlaylistArtMosaic";
import { SortableTrackRow } from "../components/SortableTrackRow";
import { useStore } from "../store/index";
import type { Track } from "../types";

export function PlaylistView() {
    const activePlaylistId = useStore((state) => state.activePlaylistId);
    const playlists = useStore((state) => state.playlists);
    const library = useStore((state) => state.library);
    const startQueue = useStore((state) => state.startQueue);
    const openRenamePlaylistModal = useStore((state) => state.openRenamePlaylistModal);
    const openDeletePlaylistModal = useStore((state) => state.openDeletePlaylistModal);

    const playlist = playlists.find((item) => item.id === activePlaylistId);
    if (!playlist) {
        return <section className="empty-state">Select a playlist.</section>;
    }

    const activePlaylist = playlist;

    const tracks: Track[] = activePlaylist.trackIds
        .map((trackId) => library.get(trackId))
        .filter((track): track is Track => Boolean(track));

    return (
        <section className="playlist-view">
            <div className="playlist-hero">
                <div className="playlist-hero-art">
                    <PlaylistArtMosaic trackIds={activePlaylist.trackIds.slice(0, 4)} />
                </div>
                <div className="playlist-hero-info">
                    <p className="label">Playlist</p>
                    <h1>{activePlaylist.name}</h1>
                    <p>{tracks.length} songs</p>
                    <div className="playlist-actions">
                        <button
                            type="button"
                            className="play-btn"
                            onClick={() => startQueue(activePlaylist.trackIds, 0)}
                            disabled={activePlaylist.trackIds.length === 0}
                        >
                            Play
                        </button>
                        <button
                            type="button"
                            onClick={() => openRenamePlaylistModal(activePlaylist.id)}
                        >
                            Rename
                        </button>
                        <button
                            type="button"
                            className="danger"
                            onClick={() => openDeletePlaylistModal(activePlaylist.id)}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>

            {tracks.length === 0 ? (
                <div className="empty-state">No tracks in this playlist yet.</div>
            ) : (
                <div className="library-table-scroll">
                    <table className="track-table" role="grid">
                        <thead>
                            <tr>
                                <th style={{ width: "48px" }}>#</th>
                                <th style={{ width: "32%" }}>Title</th>
                                <th style={{ width: "23%" }}>Artist</th>
                                <th style={{ width: "23%" }}>Album</th>
                                <th style={{ width: "10%" }}>Time</th>
                                <th style={{ width: "34px" }} />
                            </tr>
                        </thead>
                        <SortableContext
                            items={activePlaylist.trackIds}
                            strategy={verticalListSortingStrategy}
                        >
                            <tbody>
                                {tracks.map((track, index) => (
                                    <SortableTrackRow
                                        key={track.id}
                                        playlistId={activePlaylist.id}
                                        track={track}
                                        index={index}
                                        onDoubleClick={() =>
                                            startQueue(activePlaylist.trackIds, index)
                                        }
                                    />
                                ))}
                            </tbody>
                        </SortableContext>
                    </table>
                </div>
            )}
        </section>
    );
}
