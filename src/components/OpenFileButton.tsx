import type { DragEvent } from "react";
import { ingestFile } from "../ingestion/ingest";
import { useToast } from "../hooks/useToast";
import { useStore } from "../store/index";

type FilePickerWindow = Window & {
    showOpenFilePicker?: (options?: {
        multiple?: boolean;
        types?: unknown;
        excludeAcceptAllOption?: boolean;
    }) => Promise<FileSystemFileHandle[]>;
};

export function OpenFileButton() {
    const addTracks = useStore((state) => state.addTracks);
    const existingPaths = useStore((state) => state.existingPaths);
    const ingestion = useStore((state) => state.ingestionProgress);
    const setIngestionProgress = useStore((state) => state.setIngestionProgress);
    const { toast } = useToast();

    async function handleClick() {
        const pickerWindow = window as FilePickerWindow;

        if (!pickerWindow.showOpenFilePicker) {
            toast("File picking is not supported in this browser.", "error");
            return;
        }

        let handles: FileSystemFileHandle[];

        try {
            handles = await pickerWindow.showOpenFilePicker({
                multiple: false,
                types: [
                    {
                        description: "Audio files",
                        accept: {
                            "audio/*": [".mp3", ".flac", ".wav", ".m4a", ".ogg", ".aac"],
                        },
                    },
                ],
                excludeAcceptAllOption: false,
            });
        } catch {
            return;
        }

        const handle = handles[0];
        if (!handle) return;

        setIngestionProgress({
            isImporting: true,
            processed: 0,
            total: 0,
        });

        try {
            await ingestFile(handle, existingPaths, {
                onBatch: (tracks) => addTracks(tracks),
                onError: (error) => toast(`Could not read "${error.fileName}"`, "error"),
                onTotal: (total) => setIngestionProgress({ processed: 0, total }),
                onProgress: (processed) => setIngestionProgress({ processed }),
            });
        } finally {
            setIngestionProgress({ isImporting: false });
        }
    }

    async function handleDrop(ev: DragEvent<HTMLDivElement>) {
        ev.preventDefault();
        ev.stopPropagation();
        const dt = ev.dataTransfer;
        if (!dt || dt.files.length === 0) return;

        const file = dt.files[0];

        if (!file.type.startsWith("audio/")) {
            toast("Only audio files are supported.", "error");
            return;
        }

        setIngestionProgress({
            isImporting: true,
            processed: 0,
            total: 1,
        });

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
    }

    return (
        <div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
            <button
                type="button"
                className="open-folder-btn add-music-btn"
                onClick={handleClick}
                disabled={ingestion.isImporting}
            >
                {ingestion.isImporting ? "Importing..." : "Add File"}

            </button>
        </div>
    );
}
