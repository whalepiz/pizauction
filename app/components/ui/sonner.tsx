"use client";
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      theme="dark"
      richColors
      toastOptions={{
        className:
          "border border-white/10 bg-zinc-900/95 text-white shadow-lg shadow-purple-500/10 backdrop-blur-sm",
      }}
    />
  );
}
