import { ingestFolder } from "../ingestion/ingest";
import { useToast } from "../hooks/useToast";
import { useStore } from "../store/index";

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

    return (
        <div>
            <button
                type="button"
                className="open-folder-btn"
                onClick={handleClick}
                disabled={ingestion.isImporting}
            >
                {ingestion.isImporting ? "Importing..." : "Open Folder"}
            </button>
        </div>
    );
}
