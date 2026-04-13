import { useEffect, useState } from "react";
import { OpenFolderButton } from "./components/OpenFolderButton";
import { Button } from "./components/ui/button";
import { ToastViewport } from "./components/ToastViewport";
import { useToastProvider } from "./hooks/useToast";
import { loadPersistedAppState } from "./persistence";
import { defaultQueueState, useStore } from "./store";
import type { Track } from "./types";
import "./App.css";

const ALL_FILTER = "__all__";

function normalize(value: string | null | undefined): string {
  return value?.trim() || "Unknown";
}

function compareTracks(left: Track, right: Track): number {
  const artistComparison = normalize(left.artist).localeCompare(normalize(right.artist));

  if (artistComparison !== 0) {
    return artistComparison;
  }

  const albumComparison = normalize(left.album).localeCompare(normalize(right.album));

  if (albumComparison !== 0) {
    return albumComparison;
  }

  const leftNumber = left.trackNumber ?? Number.POSITIVE_INFINITY;
  const rightNumber = right.trackNumber ?? Number.POSITIVE_INFINITY;

  if (leftNumber !== rightNumber) {
    return leftNumber - rightNumber;
  }

  return left.title.localeCompare(right.title);
}

function App() {
  const library = useStore((state) => state.library);
  const libraryVersion = useStore((state) => state.libraryVersion);
  const queueLength = useStore((state) => state.queueState.queue.length);
  const theme = useStore((state) => state.theme);
  const { toasts, dismiss } = useToastProvider();
  const [selectedArtist, setSelectedArtist] = useState(ALL_FILTER);
  const [selectedAlbum, setSelectedAlbum] = useState(ALL_FILTER);

  const trackCount = library.size();
  const albumCount = library.albums.size;
  const artistCount = library.artists.size;
  const tracks = library.toArray().sort(compareTracks);
  const artistOptions = [...library.artists.keys()].sort((left, right) => left.localeCompare(right));
  const artistSelectValue = artistOptions.includes(selectedArtist) ? selectedArtist : ALL_FILTER;
  const albumOptions = (
    selectedArtist === ALL_FILTER || !artistOptions.includes(selectedArtist)
      ? [...library.albums.values()]
      : [...library.albums.values()].filter((album) => album.artist === selectedArtist)
  )
    .map((album) => ({ key: album.key, label: `${album.title} | ${album.artist}` }))
    .sort((left, right) => left.label.localeCompare(right.label));
  const albumSelectValue = albumOptions.some((album) => album.key === selectedAlbum)
    ? selectedAlbum
    : ALL_FILTER;

  const visibleTracks = tracks.filter((track) => {
    const artistMatches =
      artistSelectValue === ALL_FILTER || normalize(track.artist) === artistSelectValue;
    const albumMatches =
      albumSelectValue === ALL_FILTER ||
      `${normalize(track.artist)}::${normalize(track.album)}` === albumSelectValue;

    return artistMatches && albumMatches;
  });

  void libraryVersion;

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
            <h2>All imported tracks</h2>
          </div>
          <span className="panel-meta">
            {visibleTracks.length} of {trackCount} total
          </span>
        </div>

        <div className="filter-bar" aria-label="Track filters">
          <label className="filter-field">
            <span>Artist</span>
            <select
              value={artistSelectValue}
              onChange={(event) => {
                setSelectedArtist(event.target.value);
                setSelectedAlbum(ALL_FILTER);
              }}
            >
              <option value={ALL_FILTER}>All artists</option>
              {artistOptions.map((artist) => (
                <option key={artist} value={artist}>
                  {artist}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>Album</span>
            <select
              value={albumSelectValue}
              onChange={(event) => setSelectedAlbum(event.target.value)}
            >
              <option value={ALL_FILTER}>All albums</option>
              {albumOptions.map((album) => (
                <option key={album.key} value={album.key}>
                  {album.label}
                </option>
              ))}
            </select>
          </label>

          <Button
            variant={"outline"}
            className="filter-reset"
            onClick={() => {
              setSelectedArtist(ALL_FILTER);
              setSelectedAlbum(ALL_FILTER);
            }}
          >
            Clear filters
          </Button>
        </div>

        {visibleTracks.length === 0 ? (
          <div className="empty-state">
            <p>No imported tracks yet.</p>
            <p>
              Open a folder to populate the library map and indices, then use
              the filters above to narrow the list.
            </p>
          </div>
        ) : (
          <ul className="track-list">
            {visibleTracks.map((track) => (
              <li key={track.id} className="track-row">
                <div className="track-left">
                  {track.coverArtUrl ? (
                    <img
                      src={track.coverArtUrl}
                      alt={`${track.title} cover`}
                      className="track-art"
                    />
                  ) : (
                    <div className="track-art track-placeholder" aria-hidden />
                  )}

                  <div>
                    <strong>{track.title}</strong>
                    <p>
                      {normalize(track.artist)} | {normalize(track.album)}
                    </p>
                  </div>
                </div>
                <div className="track-meta">
                  <span>{track.trackNumber ?? "-"}</span>
                  <span>{track.filePath}</span>
                </div>
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
