import { useStore } from "../store";

export function PlaylistView() {
    const playlists = useStore((state) => state.playlists);
    const activePlaylistId = useStore((state) => state.activePlaylistId);

    const activePlaylist = playlists.find((playlist) => playlist.id === activePlaylistId);

    return (
        <section className="playlist-placeholder">
            <h1>{activePlaylist?.name ?? "Playlist"}</h1>
            <p>
                Playlist management arrives in Phase 5. This placeholder keeps shell navigation
                complete for Phase 4.
            </p>
        </section>
    );
}
