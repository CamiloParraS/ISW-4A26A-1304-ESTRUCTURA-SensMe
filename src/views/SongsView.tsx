import { useEffect, useMemo, useRef, useState } from "react";
import { OpenFolderButton } from "../components/OpenFolderButton";
import { OpenFileButton } from "../components/OpenFileButton";
import { TrackRow } from "../components/TrackRow";
import { useStore } from "../store/index";
import type { SortField } from "../types";
import { searchTracks } from "../utils/search";
import { sortTracks } from "../utils/sort";

const ROW_HEIGHT = 52;
const OVERSCAN = 8;

export function SongsView() {
    const library = useStore((state) => state.library);
    const libraryVersion = useStore((state) => state.libraryVersion);
    const startQueue = useStore((state) => state.startQueue);
    const sortState = useStore((state) => state.sortState);
    const setSortState = useStore((state) => state.setSortState);
    const query = useStore((state) => state.libraryQuery);
    const setLibraryQuery = useStore((state) => state.setLibraryQuery);

    const [debouncedQuery, setDebouncedQuery] = useState(query);
    const [scrollTop, setScrollTop] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(420);
    const scrollRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedQuery(query);
        }, 120);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [query]);

    useEffect(() => {
        const element = scrollRef.current;

        if (!element) {
            return;
        }

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                setViewportHeight(entry.contentRect.height);
            }
        });

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, []);

    const tracks = useMemo(() => {
        void libraryVersion;
        const allTracks = library.toArray();
        const filtered = debouncedQuery ? searchTracks(debouncedQuery, allTracks) : allTracks;
        return sortTracks(filtered, sortState.field, sortState.dir);
    }, [library, libraryVersion, debouncedQuery, sortState.field, sortState.dir]);

    function handleHeaderClick(field: SortField) {
        setScrollTop(0);
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }

        if (field === sortState.field) {
            setSortState({
                field,
                dir: sortState.dir === "asc" ? "desc" : "asc",
            });
            return;
        }

        setSortState({ field, dir: "asc" });
    }

    function handleRowDoubleClick(index: number) {
        const ids = tracks.map((track) => track.id);
        startQueue(ids, index);
    }

    const totalTracks = library.size();

    if (totalTracks === 0) {
        return (
            <section className="songs-view">
                <div className="empty-state empty-state--hero">
                    <p className="empty-state-icon" aria-hidden>
                        [*]
                    </p>
                    <h1>Tu biblioteca está vacía</h1>
                    <p>Abre una carpeta para escanear pistas, portadas y metadatos.</p>
                    <OpenFolderButton />
                    <OpenFileButton />
                </div>
            </section>
        );
    }

    const columns: { field: SortField; label: string; width: string }[] = [
        { field: "title", label: "Título", width: "32%" },
        { field: "artist", label: "Artista", width: "21%" },
        { field: "album", label: "Álbum", width: "21%" },
        { field: "duration", label: "Tiempo", width: "11%" },
        { field: "playCount", label: "Reproducciones", width: "9%" },
    ];

    const visibleCount = Math.ceil(viewportHeight / ROW_HEIGHT) + OVERSCAN * 2;
    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const endIndex = Math.min(tracks.length, startIndex + visibleCount);
    const visibleTracks = tracks.slice(startIndex, endIndex);
    const topSpacer = startIndex * ROW_HEIGHT;
    const bottomSpacer = Math.max(
        0,
        tracks.length * ROW_HEIGHT - topSpacer - visibleTracks.length * ROW_HEIGHT,
    );

    return (
        <section className="songs-view">
            <div className="view-header">
                <div>
                    <h1>Canciones</h1>
                    <p className="track-count">{tracks.length} canciones</p>
                </div>
                <input
                    type="search"
                    placeholder="Buscar título, artista, álbum..."
                    value={query}
                    onChange={(event) => {
                        setScrollTop(0);
                        if (scrollRef.current) {
                            scrollRef.current.scrollTop = 0;
                        }
                        setLibraryQuery(event.target.value);
                    }}
                    className="search-input"
                    aria-label="Buscar canciones"
                />
            </div>

            <div
                className="library-table-scroll"
                ref={scrollRef}
                onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
            >
                <table className="track-table" role="grid">
                    <thead>
                        <tr>
                            <th style={{ width: "48px" }}>#</th>
                            {columns.map((column) => (
                                <th
                                    key={column.field}
                                    style={{ width: column.width }}
                                    className="sortable-header"
                                    aria-sort={
                                        sortState.field === column.field
                                            ? sortState.dir === "asc"
                                                ? "ascending"
                                                : "descending"
                                            : "none"
                                    }
                                    onClick={() => handleHeaderClick(column.field)}
                                >
                                    {column.label}
                                    {sortState.field === column.field && (
                                        <span aria-hidden>
                                            {sortState.dir === "asc" ? " ^" : " v"}
                                        </span>
                                    )}
                                </th>
                            ))}
                            <th style={{ width: "34px" }} />
                        </tr>
                    </thead>
                    <tbody>
                        {topSpacer > 0 && (
                            <tr className="track-spacer" aria-hidden>
                                <td colSpan={7} style={{ height: `${topSpacer}px` }} />
                            </tr>
                        )}

                        {visibleTracks.map((track, index) => {
                            const absoluteIndex = startIndex + index;
                            return (
                                <TrackRow
                                    key={track.id}
                                    track={track}
                                    index={absoluteIndex}
                                    onDoubleClick={() => handleRowDoubleClick(absoluteIndex)}
                                />
                            );
                        })}

                        {bottomSpacer > 0 && (
                            <tr className="track-spacer" aria-hidden>
                                <td colSpan={7} style={{ height: `${bottomSpacer}px` }} />
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {tracks.length === 0 && (
                <div className="empty-state">
                    <p>Ninguna canción coincide con tu búsqueda.</p>
                </div>
            )}
        </section>
    );
}