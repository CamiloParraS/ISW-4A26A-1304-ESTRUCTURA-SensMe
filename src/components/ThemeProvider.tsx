import { useEffect, type ReactNode } from "react";
import { useStore } from "../store/index";

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const theme = useStore((state) => state.theme);

    useEffect(() => {
        const root = document.documentElement;

        if (theme === "system") {
            root.removeAttribute("data-theme");
            return;
        }

        root.setAttribute("data-theme", theme);
    }, [theme]);

    return <>{children}</>;
}
