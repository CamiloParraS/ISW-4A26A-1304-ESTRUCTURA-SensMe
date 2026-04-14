import { useEffect, useMemo, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useToast } from "../hooks/useToast";
import { useStore } from "../store/index";

export function PlaylistModals() {
    const playlistModal = useStore((state) => state.playlistModal);
    const playlists = useStore((state) => state.playlists);
    const setActivePlaylistId = useStore((state) => state.setActivePlaylistId);
    const setActiveView = useStore((state) => state.setActiveView);
    const closePlaylistModal = useStore((state) => state.closePlaylistModal);
    const createPlaylist = useStore((state) => state.createPlaylist);
    const renamePlaylist = useStore((state) => state.renamePlaylist);
    const deletePlaylist = useStore((state) => state.deletePlaylist);
    const addTrackToPlaylist = useStore((state) => state.addTrackToPlaylist);
    const { toast } = useToast();

    const targetPlaylist = useMemo(() => {
        if (!playlistModal || playlistModal.type === "create") {
            return null;
        }

        return playlists.find((playlist) => playlist.id === playlistModal.playlistId) ?? null;
    }, [playlistModal, playlists]);

    useEffect(() => {
        if (!playlistModal) {
            return;
        }

        document.body.classList.add("playlist-modal-open");

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closePlaylistModal();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            document.body.classList.remove("playlist-modal-open");
        };
    }, [playlistModal, closePlaylistModal]);

    if (!playlistModal) {
        return null;
    }

    function hasDuplicateName(name: string, ignoreId?: string): boolean {
        const normalized = name.trim().toLocaleLowerCase();
        return playlists.some(
            (playlist) =>
                playlist.id !== ignoreId &&
                playlist.name.trim().toLocaleLowerCase() === normalized,
        );
    }

    function handleCreateSubmit(event: FormEvent) {
        event.preventDefault();

        if (!playlistModal || playlistModal.type !== "create") {
            return;
        }

        const form = event.currentTarget as HTMLFormElement;
        const formData = new FormData(form);
        const name = String(formData.get("playlistName") ?? "").trim();
        if (!name) {
            toast("Playlist name is required.", "error");
            return;
        }

        if (hasDuplicateName(name)) {
            toast("A playlist with this name already exists.", "error");
            return;
        }

        try {
            const created = createPlaylist(name);
            if (playlistModal.trackId) {
                const result = addTrackToPlaylist(created.id, playlistModal.trackId);
                if (result === "playlist-not-found") {
                    toast("The playlist could not be found.", "error");
                }
            }

            setActivePlaylistId(created.id);
            setActiveView("playlist");
            closePlaylistModal();
        } catch {
            toast("Could not create playlist.", "error");
        }
    }

    function handleRenameSubmit(event: FormEvent) {
        event.preventDefault();

        if (!targetPlaylist) {
            toast("Playlist not found.", "error");
            closePlaylistModal();
            return;
        }

        const form = event.currentTarget as HTMLFormElement;
        const formData = new FormData(form);
        const nextName = String(formData.get("playlistName") ?? "").trim();
        if (!nextName) {
            toast("Playlist name is required.", "error");
            return;
        }

        if (hasDuplicateName(nextName, targetPlaylist.id)) {
            toast("A playlist with this name already exists.", "error");
            return;
        }

        try {
            renamePlaylist(targetPlaylist.id, nextName);
            closePlaylistModal();
        } catch {
            toast("Could not rename playlist.", "error");
        }
    }

    function handleDeleteConfirm() {
        if (!targetPlaylist) {
            toast("Playlist not found.", "error");
            closePlaylistModal();
            return;
        }

        try {
            deletePlaylist(targetPlaylist.id);
            closePlaylistModal();
        } catch {
            toast("Could not delete playlist.", "error");
        }
    }

    if (playlistModal.type === "create") {
        return (
            <ModalShell
                title="Create Playlist"
                subtitle="Give your new playlist a name."
                onClose={closePlaylistModal}
            >
                <form className="playlist-modal-form" onSubmit={handleCreateSubmit}>
                    <input
                        autoFocus
                        type="text"
                        name="playlistName"
                        className="playlist-modal-input"
                        placeholder="Playlist name"
                        maxLength={80}
                    />
                    <div className="playlist-modal-actions">
                        <button type="button" onClick={closePlaylistModal}>
                            Cancel
                        </button>
                        <button type="submit" className="play-btn">
                            Create
                        </button>
                    </div>
                </form>
            </ModalShell>
        );
    }

    if (playlistModal.type === "rename") {
        return (
            <ModalShell
                title="Rename Playlist"
                subtitle={targetPlaylist ? targetPlaylist.name : "Rename this playlist."}
                onClose={closePlaylistModal}
            >
                <form className="playlist-modal-form" onSubmit={handleRenameSubmit}>
                    <input
                        autoFocus
                        type="text"
                        name="playlistName"
                        className="playlist-modal-input"
                        defaultValue={targetPlaylist?.name ?? ""}
                        placeholder="New playlist name"
                        maxLength={80}
                    />
                    <div className="playlist-modal-actions">
                        <button type="button" onClick={closePlaylistModal}>
                            Cancel
                        </button>
                        <button type="submit" className="play-btn">
                            Save
                        </button>
                    </div>
                </form>
            </ModalShell>
        );
    }

    return (
        <ModalShell
            title="Delete Playlist"
            subtitle={
                targetPlaylist
                    ? `This will permanently delete ${targetPlaylist.name}.`
                    : "This playlist no longer exists."
            }
            onClose={closePlaylistModal}
        >
            <div className="playlist-modal-actions">
                <button type="button" onClick={closePlaylistModal}>
                    Cancel
                </button>
                <button type="button" className="playlist-modal-danger" onClick={handleDeleteConfirm}>
                    Delete
                </button>
            </div>
        </ModalShell>
    );
}

function ModalShell({
    title,
    subtitle,
    children,
    onClose,
}: {
    title: string;
    subtitle: string;
    children: ReactNode;
    onClose: () => void;
}) {
    return createPortal(
        <div className="playlist-modal-overlay" role="presentation" onMouseDown={onClose}>
            <section
                className="playlist-modal"
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <header className="playlist-modal-header">
                    <h2>{title}</h2>
                    <p>{subtitle}</p>
                </header>
                {children}
            </section>
        </div>,
        document.body,
    );
}
