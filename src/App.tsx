import { useEffect } from "react";
import { Shell } from "./components/Shell";
import { ThemeProvider } from "./components/ThemeProvider";
import { ToastProvider } from "./components/ToastProvider";
import { loadPersistedAppState } from "./persistence";
import { defaultQueueState, useStore } from "./store/index";
import "./styles/theme.css";
import "./styles/shell.css";

function App() {
  const setLibrary = useStore((state) => state.setLibrary);
  const setPlaylists = useStore((state) => state.setPlaylists);
  const setQueueState = useStore((state) => state.setQueueState);
  const setTheme = useStore((state) => state.setTheme);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const persisted = await loadPersistedAppState();

      if (cancelled) {
        return;
      }

      setLibrary(persisted.tracks);
      setPlaylists(persisted.playlists);
      setQueueState(persisted.queueState ?? defaultQueueState);
      setTheme(persisted.theme);
    })();

    return () => {
      cancelled = true;
    };
  }, [setLibrary, setPlaylists, setQueueState, setTheme]);

  return (
    <ThemeProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
