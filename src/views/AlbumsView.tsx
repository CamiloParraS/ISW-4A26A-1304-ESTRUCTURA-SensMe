import { useMemo, useState } from "react";
import { OpenFolderButton } from "../components/OpenFolderButton";
import { OpenFileButton } from "../components/OpenFileButton";
import { useStore } from "../store/index";
import type { Album } from "../types";
import { AlbumDetail } from "./AlbumDetail";

export function AlbumsView() {
    const library = useStore((state) => state.library);
    const libraryVersion = useStore((state) => state.libraryVersion);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);

    const albums = useMemo<Album[]>(() => {
        void libraryVersion;
        return [...library.albums.values()].sort((left, right) =>
            left.title.localeCompare(right.title),
        );
    }, [library, libraryVersion]);

    const selectedAlbum = selectedKey
        ? albums.find((album) => album.key === selectedKey) ?? null
        : null;

    if (selectedAlbum) {
        return <AlbumDetail album={selectedAlbum} onBack={() => setSelectedKey(null)} />;
    }

    return (
        <section className="albums-view">
            <div className="view-header">
                <div>
                    <h1>Albums</h1>
                    <p className="track-count">{albums.length} albums</p>
                </div>
            </div>

            {albums.length === 0 ? (
                <div className="empty-state empty-state--hero compact">
                    <p className="empty-state-icon" aria-hidden>
                        [*]
                    </p>
                    <h2>No albums yet</h2>
                    <p>Import a folder to build your album collection.</p>
                    <OpenFolderButton />
                    <OpenFileButton />
                </div>
            ) : (
                <div className="albums-grid">
                    {albums.map((album) => (
                        <AlbumCard
                            key={album.key}
                            album={album}
                            onClick={() => setSelectedKey(album.key)}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

function AlbumCard({ album, onClick }: { album: Album; onClick: () => void }) {
    return (
        <button type="button" className="album-card" onClick={onClick} aria-label={album.title}>
            <div className="album-art-wrapper">
                {album.coverArtUrl ? (
                    <img src={album.coverArtUrl} alt={`${album.title} cover`} />
                ) : (
                    <div className="album-art-placeholder" aria-hidden>
                        NOTE
                    </div>
                )}
            </div>
            <p className="album-card-title">
                <span
                    aria-label={album.title}
                    title={album.title}
                    style={{
                        display: "inline-block",
                        maxWidth: 150,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        verticalAlign: "middle",
                    }}
                >
                    {album.title}
                </span>
            </p>
            <p className="album-card-artist">
                <span
                    aria-label={album.artist}
                    title={album.artist}
                    style={{
                        display: "inline-block",
                        maxWidth: 140,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        verticalAlign: "middle",
                    }}
                >
                    {album.artist}
                </span>
            </p>
            {album.year && (
                <p className="album-card-year">
                    <span
                        aria-label={String(album.year)}
                        title={String(album.year)}
                        style={{
                            display: "inline-block",
                            maxWidth: 80,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            verticalAlign: "middle",
                        }}
                    >
                        {album.year}
                    </span>
                </p>
            )}
        </button>
    );
}
