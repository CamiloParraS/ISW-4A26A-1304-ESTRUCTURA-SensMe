import { OpenFolderButton } from "./OpenFolderButton";
import { useStore } from "../store";
import type { Theme } from "../types";

function nextTheme(theme: Theme): Theme {
    if (theme === "dark") {
        return "light";
    }

    if (theme === "light") {
        return "system";
    }

    return "dark";
}

export function Sidebar() {
    const view = useStore((state) => state.activeView);
    const setView = useStore((state) => state.setActiveView);
    const playlists = useStore((state) => state.playlists);
    const activePlaylistId = useStore((state) => state.activePlaylistId);
    const setActivePlaylist = useStore((state) => state.setActivePlaylistId);
    const theme = useStore((state) => state.theme);
    const setTheme = useStore((state) => state.setTheme);

    const navItems = [
        { id: "library" as const, label: "Library", icon: "LIB" },
        { id: "albums" as const, label: "Albums", icon: "ALB" },
    ];

    return (
        <nav className="sidebar" aria-label="Main navigation">
            <div className="sidebar-logo">WebPlayer</div>

            <ul className="sidebar-nav">
                {navItems.map((item) => (
                    <li key={item.id}>
                        <button
                            type="button"
                            className={`nav-item ${view === item.id ? "nav-item--active" : ""}`}
                            onClick={() => setView(item.id)}
                        >
                            <span className="nav-icon" aria-hidden>
                                {item.icon}
                            </span>
                            <span className="nav-label">{item.label}</span>
                        </button>
                    </li>
                ))}
            </ul>

            <div className="sidebar-section-label">Playlists</div>
            <ul className="sidebar-playlists">
                {playlists.map((playlist) => (
                    <li key={playlist.id}>
                        <button
                            type="button"
                            className={`nav-item ${view === "playlist" && activePlaylistId === playlist.id
                                    ? "nav-item--active"
                                    : ""
                                }`}
                            onClick={() => {
                                setView("playlist");
                                setActivePlaylist(playlist.id);
                            }}
                        >
                            <span className="nav-label">{playlist.name}</span>
                        </button>
                    </li>
                ))}
                {playlists.length === 0 && (
                    <li className="sidebar-empty">No playlists yet</li>
                )}
            </ul>

            <div className="sidebar-footer">
                <OpenFolderButton />
                <button
                    type="button"
                    className="theme-toggle"
                    onClick={() => setTheme(nextTheme(theme))}
                    aria-label="Toggle theme"
                >
                    Theme: {theme}
                </button>
            </div>
        </nav>
    );
}
