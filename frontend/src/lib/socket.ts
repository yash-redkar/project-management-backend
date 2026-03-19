"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (typeof window === "undefined") return null;

  if (!socket) {
    const token = localStorage.getItem("accessToken") || "";

    socket = io("http://localhost:8000", {
      transports: ["websocket"],
      withCredentials: true,
      auth: {
        token,
      },
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
