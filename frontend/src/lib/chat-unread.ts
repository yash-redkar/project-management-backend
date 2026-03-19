export const CHAT_UNREAD_STORAGE_KEY = "taskforge_chat_unread_counts";

export function getChatUnreadCounts(): Record<string, number> {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(CHAT_UNREAD_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setChatUnreadCounts(counts: Record<string, number>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHAT_UNREAD_STORAGE_KEY, JSON.stringify(counts));
}

export function incrementChatUnread(conversationId: string) {
  if (!conversationId || typeof window === "undefined") return;

  const counts = getChatUnreadCounts();
  counts[conversationId] = (counts[conversationId] || 0) + 1;
  setChatUnreadCounts(counts);
  window.dispatchEvent(new Event("taskforge-chat-unread-updated"));
}

export function clearChatUnread(conversationId: string) {
  if (!conversationId || typeof window === "undefined") return;

  const counts = getChatUnreadCounts();
  counts[conversationId] = 0;
  setChatUnreadCounts(counts);
  window.dispatchEvent(new Event("taskforge-chat-unread-updated"));
}

export function getTotalUnreadCount() {
  const counts = getChatUnreadCounts();
  return Object.values(counts).reduce((sum, value) => sum + value, 0);
}
