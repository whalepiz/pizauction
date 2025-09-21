"use client";
import React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  // Toaster đã được render ở layout.tsx, không cần thêm ở đây
  return <>{children}</>;
}
