import { ingestFolder } from "../ingestion/ingest";
import { useToast } from "../hooks/useToast";
import { useStore } from "../store";
import { Button } from "./ui/button";

type DirectoryPickerWindow = Window & {
    showDirectoryPicker?: (options?: {
        mode?: "read" | "readwrite";
    }) => Promise<FileSystemDirectoryHandle>;
};

export function OpenFolderButton() {
    const addTracks = useStore((state) => state.addTracks);
    const existingPaths = useStore((state) => state.existingPaths);
    const ingestion = useStore((state) => state.ingestionProgress);
    const setIngestionProgress = useStore((state) => state.setIngestionProgress);
    const { toast } = useToast();

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

        setIngestionProgress({
            isImporting: true,
            processed: 0,
            total: 0,
        });

        try {
            await ingestFolder(rootHandle, existingPaths, {
                onBatch: (tracks) => addTracks(tracks),
                onError: (error) => toast(`Could not read "${error.fileName}"`, "error"),
                onTotal: (total) => setIngestionProgress({ processed: 0, total }),
                onProgress: (processed) => setIngestionProgress({ processed }),
            });
        } finally {
            setIngestionProgress({ isImporting: false });
        }
    }

    const progressPct = ingestion.total > 0
        ? Math.round((ingestion.processed / ingestion.total) * 100)
        : 0;

    return (
        <div className="open-folder-wrap">
            <Button
                variant="outline"
                size="sm"
                type="button"
                className="open-folder-btn"
                onClick={handleClick}
                disabled={ingestion.isImporting}
            >
                {ingestion.isImporting ? "Importing..." : "Open Folder"}
            </Button>
            {ingestion.isImporting && ingestion.total > 0 && (
                <div className="ingestion-progress" role="progressbar" aria-valuemin={0} aria-valuemax={ingestion.total} aria-valuenow={ingestion.processed}>
                    <div className="ingestion-progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
            )}
            <p className="open-folder-status">
                {ingestion.total > 0
                    ? `${ingestion.processed} / ${ingestion.total} files processed`
                    : "Pick a folder to begin."}
            </p>
        </div>
    );
}
