import { useStore } from "../store";
import { AlbumsView } from "../views/AlbumsView";
import { LibraryView } from "../views/LibraryView";
import { PlaylistView } from "../views/PlaylistView";
import { PlaybackBar } from "./PlaybackBar";
import { QueuePanel } from "./QueuePanel";
import { Sidebar } from "./Sidebar";

export function Shell() {
    const view = useStore((state) => state.activeView);

    return (
        <div className="shell">
            <Sidebar />
            <main className="main-content">
                {view === "library" && <LibraryView />}
                {view === "albums" && <AlbumsView />}
                {view === "playlist" && <PlaylistView />}
            </main>
            <PlaybackBar />
            <QueuePanel />
        </div>
    );
}
