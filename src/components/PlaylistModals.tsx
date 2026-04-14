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
            toast("El nombre de la lista de reproducción es obligatorio.", "error");
            return;
        }

        if (name.length > 15) {
            toast("El nombre de la lista de reproducción debe tener 15 caracteres o menos.", "error");
            return;
        }

        if (hasDuplicateName(name)) {
            toast("Ya existe una lista de reproducción con ese nombre.", "error");
            return;
        }

        try {
            const created = createPlaylist(name);
            if (playlistModal.trackId) {
                const result = addTrackToPlaylist(created.id, playlistModal.trackId);
                if (result === "playlist-not-found") {
                    toast("No se pudo encontrar la lista de reproducción.", "error");
                }
            }

            setActivePlaylistId(created.id);
            setActiveView("playlist");
            closePlaylistModal();
        } catch {
            toast("No se pudo crear la lista de reproducción.", "error");
        }
    }

    function handleRenameSubmit(event: FormEvent) {
        event.preventDefault();

        if (!targetPlaylist) {
            toast("No se encontró la lista de reproducción.", "error");
            closePlaylistModal();
            return;
        }

        const form = event.currentTarget as HTMLFormElement;
        const formData = new FormData(form);
        const nextName = String(formData.get("playlistName") ?? "").trim();
        if (!nextName) {
            toast("El nombre de la lista de reproducción es obligatorio.", "error");
            return;
        }

        if (nextName.length > 15) {
            toast("El nombre de la lista de reproducción debe tener 15 caracteres o menos.", "error");
            return;
        }

        if (hasDuplicateName(nextName, targetPlaylist.id)) {
            toast("Ya existe una lista de reproducción con ese nombre.", "error");
            return;
        }

        try {
            renamePlaylist(targetPlaylist.id, nextName);
            closePlaylistModal();
        } catch {
            toast("No se pudo cambiar el nombre de la lista de reproducción.", "error");
        }
    }

    function handleDeleteConfirm() {
        if (!targetPlaylist) {
            toast("No se encontró la lista de reproducción.", "error");
            closePlaylistModal();
            return;
        }

        try {
            deletePlaylist(targetPlaylist.id);
            closePlaylistModal();
        } catch {
            toast("No se pudo eliminar la lista de reproducción.", "error");
        }
    }

    if (playlistModal.type === "create") {
        return (
            <ModalShell
                title="Crear lista de reproducción"
                subtitle="Asigna un nombre a tu nueva lista de reproducción."
                onClose={closePlaylistModal}
            >
                <form className="playlist-modal-form" onSubmit={handleCreateSubmit}>
                    <input
                        autoFocus
                        type="text"
                        name="playlistName"
                        className="playlist-modal-input"
                        placeholder="Nombre de la lista de reproducción"
                        maxLength={15}
                    />
                    <div className="playlist-modal-actions">
                        <button type="button" onClick={closePlaylistModal}>
                            Cancelar
                        </button>
                        <button type="submit" className="play-btn">
                            Crear
                        </button>
                    </div>
                </form>
            </ModalShell>
        );
    }

    if (playlistModal.type === "rename") {
        return (
            <ModalShell
                title="Cambiar nombre de la lista de reproducción"
                subtitle={targetPlaylist ? targetPlaylist.name : "Cambia el nombre de esta lista de reproducción."}
                onClose={closePlaylistModal}
            >
                <form className="playlist-modal-form" onSubmit={handleRenameSubmit}>
                    <input
                        autoFocus
                        type="text"
                        name="playlistName"
                        className="playlist-modal-input"
                        defaultValue={targetPlaylist?.name ?? ""}
                        placeholder="Nuevo nombre de la lista de reproducción"
                        maxLength={15}
                    />
                    <div className="playlist-modal-actions">
                        <button type="button" onClick={closePlaylistModal}>
                            Cancelar
                        </button>
                        <button type="submit" className="play-btn">
                            Guardar
                        </button>
                    </div>
                </form>
            </ModalShell>
        );
    }

    return (
        <ModalShell
            title="Eliminar lista de reproducción"
            subtitle={
                targetPlaylist
                    ? `Esto eliminará permanentemente ${targetPlaylist.name}.`
                    : "Esta lista de reproducción ya no existe."
            }
            onClose={closePlaylistModal}
        >
            <div className="playlist-modal-actions">
                <button type="button" onClick={closePlaylistModal}>
                    Cancelar
                </button>
                <button type="button" className="playlist-modal-danger" onClick={handleDeleteConfirm}>
                    Eliminar
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
