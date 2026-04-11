import { useState } from "react";
import { ingestFolder } from "../ingestion/ingest";
import { useToast } from "../hooks/useToast";
import { useStore } from "../store";

type DirectoryPickerWindow = Window & {
    showDirectoryPicker?: (options?: {
        mode?: "read" | "readwrite";
    }) => Promise<FileSystemDirectoryHandle>;
};

export function OpenFolderButton() {
    const addTracks = useStore((state) => state.addTracks);
    const existingPaths = useStore((state) => state.existingPaths);
    const { toast } = useToast();
    const [isImporting, setIsImporting] = useState(false);
    const [progress, setProgress] = useState({ processed: 0, total: 0 });

    async function handleClick() {
        const pickerWindow = window as DirectoryPickerWindow;

        if (!pickerWindow.showDirectoryPicker) {
            toast("Folder picking is not supported in this browser.", "error");
            return;
        }

        let rootHandle: FileSystemDirectoryHandle;

        try {
            rootHandle = await pickerWindow.showDirectoryPicker({ mode: "read" });
        } catch {
            return;
        }

        setIsImporting(true);
        setProgress({ processed: 0, total: 0 });

        try {
            await ingestFolder(rootHandle, existingPaths, {
                onBatch: (tracks) => addTracks(tracks),
                onError: (error) => toast(`Could not read "${error.fileName}"`, "error"),
                onTotal: (total) => setProgress({ processed: 0, total }),
                onProgress: (processed) =>
                    setProgress((current) => ({ ...current, processed })),
            });
        } finally {
            setIsImporting(false);
        }
    }

    return (
        <div className="open-folder-wrap">
            <button type="button" className="open-folder-btn" onClick={handleClick} disabled={isImporting}>
                {isImporting ? "Importing..." : "Open Folder"}
            </button>
            <p className="open-folder-status">
                {progress.total > 0
                    ? `${progress.processed} / ${progress.total} files processed`
                    : "Pick a folder to begin."}
            </p>
        </div>
    );
}
