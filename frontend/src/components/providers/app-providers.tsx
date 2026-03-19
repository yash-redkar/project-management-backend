"use client";

import { Toaster } from "react-hot-toast";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#0f172a",
            color: "#fff",
            border: "1px solid #1e293b",
            borderRadius: "16px",
          },
        }}
      />
    </>
  );
}
