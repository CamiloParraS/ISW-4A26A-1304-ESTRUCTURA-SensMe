import type { ToastMessage } from "../hooks/useToast";

interface ToastViewportProps {
    toasts: ToastMessage[];
    onDismiss: (id: string) => void;
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
    return (
        <div className="toast-viewport" aria-live="polite" aria-atomic="false">
            {toasts.map((toast) => (
                <article key={toast.id} className={`toast toast-${toast.type}`} role="status">
                    <div className="toast-copy">
                        <strong>{toast.type}</strong>
                        <p>{toast.message}</p>
                    </div>
                    <button type="button" className="toast-dismiss" onClick={() => onDismiss(toast.id)}>
                        Dismiss
                    </button>
                </article>
            ))}
        </div>
    );
}
