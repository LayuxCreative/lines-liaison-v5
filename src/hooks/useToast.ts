import { useState } from "react";
import { ToastMessage } from "../lib/types";

export const useToast = () => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, "id">) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2);
    setMessages((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const showSuccess = (title: string, message?: string, duration?: number) => {
    addToast({ type: "success", title, message, duration });
  };

  const showError = (title: string, message?: string, duration?: number) => {
    addToast({ type: "error", title, message, duration });
  };

  const showInfo = (title: string, message?: string, duration?: number) => {
    addToast({ type: "info", title, message, duration });
  };

  return {
    messages,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
  };
};