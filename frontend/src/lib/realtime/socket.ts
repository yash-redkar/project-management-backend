export type RealtimeStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected";

export const socketManager = {
  connect() {
    return { status: "idle" as RealtimeStatus };
  },
  disconnect() {
    return { status: "disconnected" as RealtimeStatus };
  },
};
