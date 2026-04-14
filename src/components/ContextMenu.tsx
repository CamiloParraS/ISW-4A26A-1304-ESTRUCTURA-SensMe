import { useEffect, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useToast } from "../hooks/useToast";
import { useStore } from "../store/index";
import type { PlaylistId, Track } from "../types";

interface ContextMenuProps {
    track: Track;
    position: { x: number; y: number };
    onClose: () => void;
    playlistId?: PlaylistId;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export function ContextMenu({
    track,
    position,
    onClose,
    playlistId,
}: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement | null>(null);
    const playlists = useStore((state) => state.playlists);
    const addTrackToPlaylist = useStore((state) => state.addTrackToPlaylist);
    const openCreatePlaylistModal = useStore((state) => state.openCreatePlaylistModal);
    const removeTrackFromPlaylist = useStore((state) => state.removeTrackFromPlaylist);
    const startQueue = useStore((state) => state.startQueue);
    const playNextInQueue = useStore((state) => state.playNextInQueue);
    const addToQueue = useStore((state) => state.addToQueue);
    const { toast } = useToast();

    useEffect(() => {
        document.body.classList.add("context-menu-open");

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        const onPointerDown = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("pointerdown", onPointerDown);

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("pointerdown", onPointerDown);
            document.body.classList.remove("context-menu-open");
        };
    }, [onClose]);

    const style: CSSProperties = {
        position: "fixed",
        top: clamp(position.y, 12, window.innerHeight - 320),
        left: clamp(position.x, 12, window.innerWidth - 260),
        zIndex: 9999,
    };

    function handleAddToPlaylist(playlistId: string) {
        const playlist = playlists.find((item) => item.id === playlistId) ?? null;
        const result = addTrackToPlaylist(playlistId, track.id);

        if (result === "already-in-playlist") {
            toast(
                `${track.title} ya está en ${playlist?.name ?? "esta lista de reproducción"}.`,
                "info",
            );
        }

        if (result === "playlist-not-found") {
            toast("No se pudo añadir la pista porque la lista de reproducción ya no existe.", "error");
        }

        onClose();
    }

    function handleNewPlaylist() {
        openCreatePlaylistModal(track.id);
        onClose();
    }

    return createPortal(
        <div
            ref={menuRef}
            className="context-menu"
            role="menu"
            style={style}
            onPointerDown={(event) => event.stopPropagation()}
        >
            <button
                type="button"
                className="context-item"
                onClick={() => {
                    startQueue([track.id], 0);
                    onClose();
                }}
            >
                Reproducir ahora
            </button>
            <button
                type="button"
                className="context-item"
                onClick={() => {
                    playNextInQueue(track.id);
                    onClose();
                }}
            >
                Reproducir después
            </button>
            <button
                type="button"
                className="context-item"
                onClick={() => {
                    addToQueue(track.id);
                    onClose();
                }}
            >
                Añadir al final de la cola
            </button>

            {playlistId && (
                <>
                    <hr className="context-divider" />
                    <button
                        type="button"
                        className="context-item context-item--danger"
                        onClick={() => {
                            removeTrackFromPlaylist(playlistId, track.id);
                            onClose();
                        }}
                    >
                        Eliminar de esta lista de reproducción
                    </button>
                </>
            )}

            <hr className="context-divider" />

            <div className="context-submenu-label">Añadir a la lista de reproducción</div>
            {playlists.map((playlist) => (
                <button
                    key={playlist.id}
                    type="button"
                    role="menuitem"
                    className="context-item context-submenu-item"
                    onClick={() => handleAddToPlaylist(playlist.id)}
                >
                    <span>{playlist.name}</span>
                    {playlist.trackIdSet.has(track.id) && (
                        <span className="checkmark" aria-hidden>
                            ✓
                        </span>
                    )}
                </button>
            ))}
            <button
                type="button"
                role="menuitem"
                className="context-item context-new-playlist"
                onClick={handleNewPlaylist}
            >
                + Nueva lista
            </button>
        </div>,
        document.body,
    );
}
