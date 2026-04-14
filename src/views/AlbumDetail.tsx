import { useMemo } from "react";
import { TrackRow } from "../components/TrackRow";
import { useStore } from "../store";
import type { Album, Track } from "../types";
import { ArrowBendUpLeftIcon as ArrowBendLeftUpIcon } from "@phosphor-icons/react/dist/ssr";

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
                <ArrowBendLeftUpIcon size={16} weight="bold" aria-hidden />
                <span style={{ marginLeft: 8 }}>Albums</span>
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

            <div className="library-table-scroll">
                <table className="track-table" role="grid">
                    <thead>
                        <tr>
                            <th style={{ width: "48px" }}>#</th>
                            <th style={{ width: "50%" }}>Title</th>
                            <th style={{ width: "22%" }}>Artist</th>
                            <th style={{ width: "11%" }}>Time</th>
                            <th style={{ width: "11%" }}>Plays</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tracks.map((track, index) => (
                            <TrackRow
                                key={track.id}
                                track={track}
                                index={index}
                                onDoubleClick={() => playAll(index)}
                                showAlbum={false}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
