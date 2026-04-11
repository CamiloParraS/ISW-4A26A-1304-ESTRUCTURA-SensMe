import { useEffect } from "react";
import { OpenFolderButton } from "./components/OpenFolderButton";
import { ToastViewport } from "./components/ToastViewport";
import { useToastProvider } from "./hooks/useToast";
import { loadPersistedAppState } from "./persistence";
import { defaultQueueState, useStore } from "./store";
// import "./App.css";

function App() {
  const library = useStore((state) => state.library);
  const queueLength = useStore((state) => state.queueState.queue.length);
  const theme = useStore((state) => state.theme);
  const { toasts, dismiss } = useToastProvider();

  const trackCount = library.size();
  const albumCount = library.albums.size;
  const artistCount = library.artists.size;
  const tracks = library.toArray();

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.dataset.theme = theme;
    }
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const persisted = await loadPersistedAppState();

      if (cancelled) {
        return;
      }

      const store = useStore.getState();
      store.setLibrary(persisted.tracks);
      store.setPlaylists(persisted.playlists);
      store.setQueueState(persisted.queueState ?? defaultQueueState);
      store.setTheme(persisted.theme);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleTracks = tracks.slice(0, 8);

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">Phase 2</p>
        <h1>Folder ingestion and metadata pipeline</h1>
        <p className="hero-copy">
          Import a music folder, parse tags, fall back to MusicBrainz, and
          hydrate the library in batches so the UI stays responsive.
        </p>
        <OpenFolderButton />
      </section>

      <section className="stats-grid" aria-label="library statistics">
        <article className="stat-card">
          <span>Tracks</span>
          <strong>{trackCount}</strong>
        </article>
        <article className="stat-card">
          <span>Albums</span>
          <strong>{albumCount}</strong>
        </article>
        <article className="stat-card">
          <span>Artists</span>
          <strong>{artistCount}</strong>
        </article>
        <article className="stat-card">
          <span>Queue</span>
          <strong>{queueLength}</strong>
        </article>
      </section>

      <section className="library-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Imported library</p>
            <h2>Recent tracks</h2>
          </div>
          <span className="panel-meta">{trackCount} total</span>
        </div>

        {visibleTracks.length === 0 ? (
          <div className="empty-state">
            <p>No imported tracks yet.</p>
            <p>Open a folder to populate the library map and indices.</p>
          </div>
        ) : (
          <ul className="track-list">
            {visibleTracks.map((track) => (
              <li key={track.id} className="track-row">
                <div>
                  <strong>{track.title}</strong>
                  <p>
                    {track.artist} · {track.album}
                  </p>
                </div>
                <span>{track.filePath}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </main>
  );
}

export default App;
