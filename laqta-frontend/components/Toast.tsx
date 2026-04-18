"use client";

import { useEffect, useState } from "react";

type ToastItem = {
  id: string;
  message: string;
  type?: "info" | "warning" | "error";
};

// Global toast store (simple)
let listeners: ((toasts: ToastItem[]) => void)[] = [];
let toasts: ToastItem[] = [];

export function showToast(message: string, type: ToastItem["type"] = "warning") {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { id, message, type }];
  listeners.forEach((l) => l(toasts));

  // auto-remove after 5 seconds
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    listeners.forEach((l) => l(toasts));
  }, 5000);
}

export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (t: ToastItem[]) => setItems([...t]);
    listeners.push(handler);
    return () => {
      listeners = listeners.filter((l) => l !== handler);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className={`flex items-start gap-3 rounded-2xl px-5 py-4 text-sm font-semibold shadow-2xl backdrop-blur ring-1 ${
            item.type === "error"
              ? "bg-red-500/90 text-white ring-red-400/30"
              : item.type === "warning"
              ? "bg-[#FF7A1A]/90 text-black ring-[#FF7A1A]/30"
              : "bg-white/10 text-white ring-white/15"
          }`}
        >
          <span>
            {item.type === "warning" && "⚠️ "}
            {item.type === "error" && "❌ "}
            {item.type === "info" && "ℹ️ "}
            {item.message}
          </span>
          <button
            onClick={() => {
              toasts = toasts.filter((t) => t.id !== item.id);
              listeners.forEach((l) => l(toasts));
            }}
            className="ml-2 opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
