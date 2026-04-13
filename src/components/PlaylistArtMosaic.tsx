import { useStore } from "../store";

interface PlaylistArtMosaicProps {
    trackIds: string[];
}

export function PlaylistArtMosaic({ trackIds }: PlaylistArtMosaicProps) {
    const library = useStore((state) => state.library);

    const artUrls: string[] = [];
    for (const trackId of trackIds) {
        const track = library.get(trackId);

        if (track?.coverArtUrl && !artUrls.includes(track.coverArtUrl)) {
            artUrls.push(track.coverArtUrl);

            if (artUrls.length === 4) {
                break;
            }
        }
    }

    if (artUrls.length === 0) {
        return <div className="playlist-art-placeholder" aria-hidden />;
    }

    if (artUrls.length === 1) {
        return <img src={artUrls[0]} alt="Playlist art" className="playlist-art-single" />;
    }

    return (
        <div className="playlist-art-mosaic">
            {artUrls.slice(0, 4).map((url, index) => (
                <img key={`${url}-${index}`} src={url} alt="" className="mosaic-cell" />
            ))}
        </div>
    );
}
