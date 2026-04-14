import { Moon, Sun, Book, List, MusicNotes } from "@phosphor-icons/react";
import { useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { OpenFolderButton } from "./OpenFolderButton";
import { OpenFileButton } from "./OpenFileButton";
import { PlaylistArtMosaic } from "./PlaylistArtMosaic";
import { useStore } from "../store/index";
import { ingestFile } from "../ingestion/ingest";
import { useToast } from "../hooks/useToast";
import { requestPermissionsForSerializedTracks } from "../persistence";
import { toast as sonnerToast } from "sonner";
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
    const missingSerializedTracks = useStore((state) => state.missingSerializedTracks);
    const setMissingSerializedTracks = useStore((state) => state.setMissingSerializedTracks);
    const { toast } = useToast();

    const lastRestoreKeyRef = useRef<string | null>(null);

    useEffect(() => {
        if (missingSerializedTracks.length === 0) return;

        const key = missingSerializedTracks.map((s) => s.id).sort().join(",");
        if (lastRestoreKeyRef.current === key) return;
        lastRestoreKeyRef.current = key;

        sonnerToast("Algunas pistas requieren reautorización.", {
            action: {
                label: "Restaurar biblioteca",
                async onClick() {
                    try {
                        setIngestionProgress({ isImporting: true, processed: 0, total: missingSerializedTracks.length });

                        const restored = await requestPermissionsForSerializedTracks(missingSerializedTracks, (restoredCount) => {
                            setIngestionProgress({ processed: restoredCount });
                        });

                        setIngestionProgress({ isImporting: false });

                        if (restored.length > 0) {
                            addTracks(restored);
                            const remaining = missingSerializedTracks.filter((s) => !restored.find((r) => r.id === s.id));
                            setMissingSerializedTracks(remaining);
                            sonnerToast.success(`${restored.length} pista${restored.length > 1 ? "s" : ""} restaurada${restored.length > 1 ? "s" : ""}.`);
                        } else {
                            sonnerToast("No se restauraron pistas.");
                        }
                    } catch (err) {
                        setIngestionProgress({ isImporting: false });
                        sonnerToast.error("Error al restaurar la biblioteca.");
                    }
                },
            },
        });
    }, [missingSerializedTracks, addTracks, setIngestionProgress, setMissingSerializedTracks]);

    const dragCounterRef = useRef(0);
    const [isDraggingOver, setIsDraggingOver] = useState(false);


    const navItems = [
        { id: "songs" as const, label: "Canciones", icon: <MusicNotes size={16} weight="bold" aria-hidden /> },
        { id: "library" as const, label: "Biblioteca", icon: <Book size={16} weight="bold" aria-hidden /> },
        { id: "albums" as const, label: "Álbumes", icon: <List size={16} weight="bold" aria-hidden /> },
    ];

    return (
        <nav className="sidebar" aria-label="Navegación principal">
            <div className="sidebar-top">
                <div className="sidebar-logo">SensMe</div>
                <button
                    type="button"
                    className="theme-toggle"
                    onClick={() => setTheme(nextTheme(theme))}
                    aria-label={resolvedTheme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
                    title={resolvedTheme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
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

            <div className="sidebar-section-label">Listas de reproducción</div>
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
                    <li className="sidebar-empty">Aún no hay listas de reproducción</li>
                )}
            </ul>

            <div className="sidebar-footer">
                <button
                    type="button"
                    className="new-playlist-btn"
                    onClick={() => openCreatePlaylistModal()}
                >
                    + Nueva lista
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
                            toast("Solo se admiten archivos de audio.", "error");
                            return;
                        }

                        setIngestionProgress({ isImporting: true, processed: 0, total: 1 });

                        try {
                            await ingestFile(file, existingPaths, {
                                onBatch: (tracks) => addTracks(tracks),
                                onError: (error) => toast(`No se pudo leer "${error.fileName}"`, "error"),
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
                            {`${ingestion.processed} / ${ingestion.total} archivos procesados`}
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
