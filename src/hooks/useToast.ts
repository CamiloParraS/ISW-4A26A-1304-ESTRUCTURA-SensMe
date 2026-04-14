import { useCallback } from "react";
import { toast as sonnerToast } from "sonner";

export type ToastType = "info" | "error" | "success";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export function useToast() {
  const toast = useCallback((message: string, type: ToastType = "info") => {
    if (type === "success") {
      sonnerToast.success(message);
    } else if (type === "error") {
      sonnerToast.error(message);
    } else {
      sonnerToast(message);
    }
  }, []);

  return { toast };
}
