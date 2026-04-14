import { type ReactNode, useMemo, useState } from "react";
import { OpenFolderButton } from "../components/OpenFolderButton";
import { OpenFileButton } from "../components/OpenFileButton";
import { PlaylistArtMosaic } from "../components/PlaylistArtMosaic";
import { useStore } from "../store/index";
import type { Album, Playlist } from "../types";
import { AlbumDetail } from "./AlbumDetail";

type LibraryFilter = "all" | "albums" | "artists" | "playlists";

export function LibraryView() {
    const library = useStore((state) => state.library);
    const libraryVersion = useStore((state) => state.libraryVersion);
    const playlists = useStore((state) => state.playlists);
    const setActiveView = useStore((state) => state.setActiveView);
    const setActivePlaylistId = useStore((state) => state.setActivePlaylistId);
    const openCreatePlaylistModal = useStore((state) => state.openCreatePlaylistModal);

    const [filter, setFilter] = useState<LibraryFilter>("all");
    const [selectedAlbumKey, setSelectedAlbumKey] = useState<string | null>(null);

    const albums = useMemo<Album[]>(() => {
        void libraryVersion;
        return [...library.albums.values()].sort((left, right) =>
            left.title.localeCompare(right.title),
        );
    }, [library, libraryVersion]);

    const sortedPlaylists = useMemo<Playlist[]>(() => {
        return [...playlists].sort((left, right) => left.name.localeCompare(right.name));
    }, [playlists]);

    const selectedAlbum = selectedAlbumKey
        ? albums.find((album) => album.key === selectedAlbumKey) ?? null
        : null;

    if (selectedAlbum) {
        return (
            <AlbumDetail
                album={selectedAlbum}
                onBack={() => setSelectedAlbumKey(null)}
                backLabel="Biblioteca"
            />
        );
    }

    const filterOptions: Array<{ id: LibraryFilter; label: string; count: number }> = [
        { id: "all", label: "Todo", count: albums.length + sortedPlaylists.length },
        { id: "albums", label: "Álbumes", count: albums.length },
        { id: "playlists", label: "Listas", count: sortedPlaylists.length },
    ];

    const showAlbums = filter === "all" || filter === "albums";
    const showPlaylists = filter === "all" || filter === "playlists";
    const hasContent =
        (showAlbums && albums.length > 0) ||
        (showPlaylists && sortedPlaylists.length > 0);

    return (
        <section className="library-view">
            <div className="view-header">
                <div>
                    <h1>Biblioteca</h1>
                    <p className="track-count">
                        {albums.length} álbumes · {sortedPlaylists.length} listas
                    </p>
                </div>
                <div className="library-filter-bar" role="tablist" aria-label="Filtros de biblioteca">
                    {filterOptions.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            className={`library-filter-button ${filter === option.id ? "library-filter-button--active" : ""}`}
                            aria-pressed={filter === option.id}
                            onClick={() => setFilter(option.id)}
                        >
                            {option.label} ({option.count})
                        </button>
                    ))}
                </div>
            </div>

            {!hasContent ? (
                <div className="empty-state empty-state--hero compact">
                    <p className="empty-state-icon" aria-hidden>
                        [*]
                    </p>
                    <h2>Aún no hay contenido en la biblioteca</h2>
                    <p>Importa música para poblar álbumes y artistas, o crea una lista de reproducción para comenzar.</p>
                    <div className="library-empty-actions">
                        <OpenFolderButton />
                        <OpenFileButton />
                        <button
                            type="button"
                            className="open-folder-btn"
                            onClick={() => openCreatePlaylistModal()}
                        >
                            + Nueva lista
                        </button>
                    </div>
                </div>
            ) : (
                <>

                    {showPlaylists && sortedPlaylists.length > 0 && (
                        <LibrarySection title="Listas de reproducción" count={sortedPlaylists.length}>
                            <div className="library-grid">
                                {sortedPlaylists.map((playlist) => (
                                    <LibraryCard
                                        key={playlist.id}
                                        title={playlist.name}
                                        subtitle={`${playlist.trackIds.length} canciones`}
                                        meta="Lista"
                                        placeholder="LR"
                                        tone="playlist"
                                        onClick={() => {
                                            setActivePlaylistId(playlist.id);
                                            setActiveView("playlist");
                                        }}
                                        art={<PlaylistArtMosaic trackIds={playlist.trackIds.slice(0, 4)} />}
                                    />
                                ))}
                            </div>
                        </LibrarySection>
                    )}
                    {showAlbums && albums.length > 0 && (
                        <LibrarySection title="Álbumes" count={albums.length}>
                            <div className="library-grid">
                                {albums.map((album) => (
                                    <LibraryCard
                                        key={album.key}
                                        title={album.title}
                                        subtitle={album.artist}
                                        meta={album.year ? String(album.year) : `${album.trackIds.length} canciones`}
                                        image={album.coverArtUrl}
                                        placeholder={getAlbumPlaceholder(album)}
                                        onClick={() => setSelectedAlbumKey(album.key)}
                                    />
                                ))}
                            </div>
                        </LibrarySection>
                    )}
                </>
            )}
        </section>
    );
}

function LibrarySection({
    title,
    count,
    children,
}: {
    title: string;
    count: number;
    children: ReactNode;
}) {
    return (
        <section className="library-section">
            <div className="library-section-header">
                <h2>{title}</h2>
                <p className="library-section-count">{count}</p>
            </div>
            {children}
        </section>
    );
}

function LibraryCard({
    title,
    subtitle,
    meta,
    placeholder,
    image,
    art,
    tone,
    onClick,
}: {
    title: string;
    subtitle: string;
    meta: string;
    placeholder: string;
    image?: string | null;
    art?: ReactNode;
    tone?: "artist" | "playlist";
    onClick?: () => void;
}) {
    const content = (
        <>
            <div className="library-card-art">
                {art ? (
                    art
                ) : image ? (
                    <img src={image} alt={`${title} cover`} />
                ) : (
                    <div
                        className={`library-card-placeholder ${tone ? `library-card-placeholder--${tone}` : ""}`}
                        aria-hidden
                    >
                        {placeholder}
                    </div>
                )}
            </div>
            <p className="library-card-title">{title}</p>
            <p className="library-card-subtitle">{subtitle}</p>
            <p className="library-card-meta">{meta}</p>
        </>
    );

    if (onClick) {
        return (
            <button
                type="button"
                className="library-card library-card--button"
                onClick={onClick}
                aria-label={title}
            >
                {content}
            </button>
        );
    }

    return <article className="library-card">{content}</article>;
}

function getAlbumPlaceholder(album: Album): string {
    if (album.title.trim()) {
        return album.title.slice(0, 2).toUpperCase();
    }

    return "AL";
}

