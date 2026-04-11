import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

export interface ToastMessage {
  id: string;
  message: string;
  type: "info" | "error" | "success";
}

let externalSetToasts: Dispatch<SetStateAction<ToastMessage[]>> | null = null;

export function useToastProvider() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    externalSetToasts = setToasts;

    return () => {
      if (externalSetToasts === setToasts) {
        externalSetToasts = null;
      }
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  return { toasts, dismiss };
}

export function useToast() {
  const toast = useCallback(
    (message: string, type: ToastMessage["type"] = "info") => {
      const id = crypto.randomUUID();

      externalSetToasts?.((current) => [...current, { id, message, type }]);

      setTimeout(() => {
        externalSetToasts?.((current) =>
          current.filter((toast) => toast.id !== id),
        );
      }, 4000);
    },
    [],
  );

  return { toast };
}
