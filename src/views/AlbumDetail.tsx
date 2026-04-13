import { useMemo } from "react";
import { useStore } from "../store";
import type { Album, Track } from "../types";
import { formatDuration } from "../utils/format";

interface AlbumDetailProps {
    album: Album;
    onBack: () => void;
}

export function AlbumDetail({ album, onBack }: AlbumDetailProps) {
    const library = useStore((state) => state.library);
    const libraryVersion = useStore((state) => state.libraryVersion);
    const startQueue = useStore((state) => state.startQueue);

    const tracks = useMemo<Track[]>(() => {
        void libraryVersion;
        return album.trackIds
            .map((id) => library.get(id))
            .filter((track): track is Track => Boolean(track));
    }, [album.trackIds, library, libraryVersion]);

    function playAll(startIndex = 0) {
        startQueue(
            tracks.map((track) => track.id),
            startIndex,
        );
    }

    return (
        <section className="album-detail">
            <button type="button" className="back-btn" onClick={onBack}>
                {"<- Albums"}
            </button>

            <div className="album-hero">
                {album.coverArtUrl ? (
                    <img src={album.coverArtUrl} alt={album.title} className="album-hero-art" />
                ) : (
                    <div className="album-art-placeholder large" aria-hidden>
                        NOTE
                    </div>
                )}

                <div className="album-hero-info">
                    <p className="label">Album</p>
                    <h1>{album.title}</h1>
                    <p>{album.artist}</p>
                    {album.year && <p>{album.year}</p>}
                    <p>{tracks.length} songs</p>
                    <button type="button" className="play-btn" onClick={() => playAll(0)}>
                        Play
                    </button>
                </div>
            </div>

            <table className="track-table">
                <thead>
                    <tr>
                        <th style={{ width: "60px" }}>#</th>
                        <th>Title</th>
                        <th style={{ width: "120px" }}>Duration</th>
                    </tr>
                </thead>
                <tbody>
                    {tracks.map((track, index) => (
                        <tr key={track.id} className="track-row" onDoubleClick={() => playAll(index)}>
                            <td className="tabular">{track.trackNumber ?? index + 1}</td>
                            <td>
                                <div>{track.title}</div>
                                {track.artist !== album.artist && (
                                    <div className="text-muted">{track.artist}</div>
                                )}
                            </td>
                            <td className="text-muted tabular">{formatDuration(track.duration)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}
