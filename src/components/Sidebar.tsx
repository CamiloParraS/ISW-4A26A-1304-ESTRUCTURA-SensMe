import { Moon, Sun, Book, List } from "@phosphor-icons/react";
import { OpenFolderButton } from "./OpenFolderButton";
import { useStore } from "../store";
import type { Theme } from "../types";

function getResolvedTheme(theme: Theme): "light" | "dark" {
    if (theme === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    return theme;
}

function nextTheme(theme: Theme): Theme {
    if (theme === "dark") {
        return "light";
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
    const resolvedTheme = getResolvedTheme(theme);

    const navItems = [
        { id: "library" as const, label: "Library", icon: <Book size={16} weight="bold" aria-hidden /> },
        { id: "albums" as const, label: "Albums", icon: <List size={16} weight="bold" aria-hidden /> },
    ];

    return (
        <nav className="sidebar" aria-label="Main navigation">
            <div className="sidebar-top">
                <div className="sidebar-logo">SensMe</div>
                <button
                    type="button"
                    className="theme-toggle"
                    onClick={() => setTheme(nextTheme(theme))}
                    aria-label={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                    title={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                >
                    {resolvedTheme === "dark" ? (
                        <Sun size={16} weight="bold" aria-hidden />
                    ) : (
                        <Moon size={16} weight="bold" aria-hidden />
                    )}
                </button>
            </div>

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
            </div>
        </nav>
    );
}
