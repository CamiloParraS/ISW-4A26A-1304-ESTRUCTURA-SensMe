import { useEffect } from "react";
import { Shell } from "./components/Shell";
import { ThemeProvider } from "./components/ThemeProvider";
import { ToastProvider } from "./components/ToastProvider";
import { useStartup } from "./hooks/useStartup";
import { useToast } from "./hooks/useToast";
import { useStore } from "./store/index";
import "./styles/theme.css";
import "./styles/shell.css";

function App() {
  const persistError = useStore((state) => state.persistError);
  const clearPersistError = useStore((state) => state.clearPersistError);
  const { toast } = useToast();

  useStartup();

  useEffect(() => {
    if (!persistError) {
      return;
    }

    if (persistError === "quota_exceeded") {
      toast("Library changes could not be saved because local storage is full.", "error");
    } else {
      toast("Library changes could not be saved due to a storage error.", "error");
    }

    clearPersistError();
  }, [clearPersistError, persistError, toast]);

  return (
    <ThemeProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
