import { Moon, Sun, Book, List, MusicNotes } from "@phosphor-icons/react";
import { useState, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { OpenFolderButton } from "./OpenFolderButton";
import { OpenFileButton } from "./OpenFileButton";
import { PlaylistArtMosaic } from "./PlaylistArtMosaic";
import { useStore } from "../store/index";
import { ingestFile } from "../ingestion/ingest";
import { useToast } from "../hooks/useToast";
import type { Playlist, Theme } from "../types";

function getResolvedTheme(theme: Theme): "light" | "dark" {
    if (theme === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    return theme;
}

function nextTheme(theme: Theme): Theme {
    if (theme === "dark") {
        return "light";
    }

    return "dark";
}

export function Sidebar() {
    const view = useStore((state) => state.activeView);
    const setView = useStore((state) => state.setActiveView);
    const playlists = useStore((state) => state.playlists);
    const activePlaylistId = useStore((state) => state.activePlaylistId);
    const setActivePlaylist = useStore((state) => state.setActivePlaylistId);
    const openCreatePlaylistModal = useStore((state) => state.openCreatePlaylistModal);
    const theme = useStore((state) => state.theme);
    const setTheme = useStore((state) => state.setTheme);
    const resolvedTheme = getResolvedTheme(theme);
    const ingestion = useStore((state) => state.ingestionProgress);
    const addTracks = useStore((state) => state.addTracks);
    const existingPaths = useStore((state) => state.existingPaths);
    const setIngestionProgress = useStore((state) => state.setIngestionProgress);
    const { toast } = useToast();

    const dragCounterRef = useRef(0);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const progressPct = ingestion.total > 0
        ? Math.round((ingestion.processed / ingestion.total) * 100)
        : 0;

    const navItems = [
        { id: "songs" as const, label: "Songs", icon: <MusicNotes size={16} weight="bold" aria-hidden /> },
        { id: "library" as const, label: "Library", icon: <Book size={16} weight="bold" aria-hidden /> },
        { id: "albums" as const, label: "Albums", icon: <List size={16} weight="bold" aria-hidden /> },
    ];

    return (
        <nav className="sidebar" aria-label="Main navigation">
            <div className="sidebar-top">
                <div className="sidebar-logo">SensMe</div>
                <button
                    type="button"
                    className="theme-toggle"
                    onClick={() => setTheme(nextTheme(theme))}
                    aria-label={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                    title={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                >
                    {resolvedTheme === "dark" ? (
                        <Sun size={16} weight="bold" aria-hidden />
                    ) : (
                        <Moon size={16} weight="bold" aria-hidden />
                    )}
                </button>
            </div>

            <ul className="sidebar-nav">
                {navItems.map((item) => (
                    <li key={item.id}>
                        <button
                            type="button"
                            className={`nav-item ${view === item.id ? "nav-item--active" : ""}`}
                            onClick={() => setView(item.id)}
                        >
                            <span className="nav-icon" aria-hidden>
                                {item.icon}
                            </span>
                            <span className="nav-label">{item.label}</span>
                        </button>
                    </li>
                ))}
            </ul>

            <div className="sidebar-section-label">Playlists</div>
            <ul className="sidebar-playlists">
                {playlists.map((playlist) => (
                    <DroppablePlaylistItem
                        key={playlist.id}
                        playlist={playlist}
                        isActive={view === "playlist" && activePlaylistId === playlist.id}
                        onOpen={() => {
                            setView("playlist");
                            setActivePlaylist(playlist.id);
                        }}
                    />
                ))}
                {playlists.length === 0 && (
                    <li className="sidebar-empty">No playlists yet</li>
                )}
            </ul>

            <div className="sidebar-footer">
                <button
                    type="button"
                    className="new-playlist-btn"
                    onClick={() => openCreatePlaylistModal()}
                >
                    + New Playlist
                </button>
                <div
                    className={`footer-actions ${isDraggingOver ? "footer-drop-over" : ""}`}
                    onDragEnter={(e) => {
                        e.preventDefault();
                        dragCounterRef.current += 1;
                        setIsDraggingOver(true);
                    }}
                    onDragOver={(e) => {
                        e.preventDefault();
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        dragCounterRef.current -= 1;
                        if (dragCounterRef.current <= 0) setIsDraggingOver(false);
                    }}
                    onDrop={async (e) => {
                        e.preventDefault();
                        dragCounterRef.current = 0;
                        setIsDraggingOver(false);

                        if ((e as any).defaultPrevented) return;

                        const dt = e.dataTransfer;
                        if (!dt || dt.files.length === 0) return;

                        const file = dt.files[0];

                        if (!file.type.startsWith("audio/")) {
                            toast("Only audio files are supported.", "error");
                            return;
                        }

                        setIngestionProgress({ isImporting: true, processed: 0, total: 1 });

                        try {
                            await ingestFile(file, existingPaths, {
                                onBatch: (tracks) => addTracks(tracks),
                                onError: (error) => toast(`Could not read "${error.fileName}"`, "error"),
                                onTotal: (total) => setIngestionProgress({ processed: 0, total }),
                                onProgress: (processed) => setIngestionProgress({ processed }),
                            });
                        } finally {
                            setIngestionProgress({ isImporting: false });
                        }
                    }}
                >
                    <OpenFolderButton />
                    <OpenFileButton />
                </div>

                {ingestion.total > 0 && (
                    <div className="footer-status">
                        <p className="footer-ingestion-status">
                            {`${ingestion.processed} / ${ingestion.total} files processed`}
                        </p>
                    </div>
                )}
            </div>
        </nav>
    );
}

function DroppablePlaylistItem({
    playlist,
    isActive,
    onOpen,
}: {
    playlist: Playlist;
    isActive: boolean;
    onOpen: () => void;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: `playlist::${playlist.id}`,
        data: {
            type: "playlist-drop",
            playlistId: playlist.id,
        },
    });

    return (
        <li ref={setNodeRef}>
            <button
                type="button"
                className={`nav-item ${isActive ? "nav-item--active" : ""} ${isOver ? "nav-item--drop-target" : ""}`}
                onClick={onOpen}
            >
                <span className="sidebar-playlist-art" aria-hidden>
                    <PlaylistArtMosaic trackIds={playlist.trackIds.slice(0, 4)} />
                </span>
                <span className="nav-label">{playlist.name}</span>
            </button>
        </li>
    );
}
