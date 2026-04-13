import type { ReactNode } from "react";
import { useToastProvider } from "../hooks/useToast";
import { ToastViewport } from "./ToastViewport";

interface ToastProviderProps {
    children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
    const { toasts, dismiss } = useToastProvider();

    return (
        <>
            {children}
            <ToastViewport toasts={toasts} onDismiss={dismiss} />
        </>
    );
}
