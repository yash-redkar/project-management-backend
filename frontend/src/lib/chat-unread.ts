export const CHAT_UNREAD_STORAGE_KEY = "teamforge_chat_unread_counts";
export const CHAT_UNREAD_META_STORAGE_KEY = "teamforge_chat_unread_meta";

type ChatConversationMeta = {
  conversationId: string;
  conversationType?: string;
  workspaceId?: string;
  projectId?: string;
  updatedAt?: number;
};

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

export function getChatUnreadMeta(): Record<string, ChatConversationMeta> {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(CHAT_UNREAD_META_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setChatUnreadMeta(meta: Record<string, ChatConversationMeta>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHAT_UNREAD_META_STORAGE_KEY, JSON.stringify(meta));
}

export function upsertChatConversationMeta(
  conversationId: string,
  meta: Partial<ChatConversationMeta>,
) {
  if (!conversationId || typeof window === "undefined") return;

  const allMeta = getChatUnreadMeta();
  const existing = allMeta[conversationId] || { conversationId };

  allMeta[conversationId] = {
    ...existing,
    ...meta,
    conversationId,
    updatedAt: Date.now(),
  };

  setChatUnreadMeta(allMeta);
}

export function incrementChatUnread(
  conversationId: string,
  meta?: Partial<ChatConversationMeta>,
) {
  if (!conversationId || typeof window === "undefined") return;

  const counts = getChatUnreadCounts();
  counts[conversationId] = (counts[conversationId] || 0) + 1;
  setChatUnreadCounts(counts);

  if (meta) {
    upsertChatConversationMeta(conversationId, meta);
  }

  window.dispatchEvent(new Event("teamforge-chat-unread-updated"));
}

export function clearChatUnread(conversationId: string) {
  if (!conversationId || typeof window === "undefined") return;

  const counts = getChatUnreadCounts();
  counts[conversationId] = 0;
  setChatUnreadCounts(counts);
  window.dispatchEvent(new Event("teamforge-chat-unread-updated"));
}

export function getTotalUnreadCount() {
  const counts = getChatUnreadCounts();
  return Object.values(counts).reduce((sum, value) => sum + value, 0);
}

export function getPrimaryUnreadChatTarget() {
  const counts = getChatUnreadCounts();
  const metaMap = getChatUnreadMeta();

  const unreadEntries = Object.entries(counts)
    .filter(([, count]) => Number(count) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]));

  if (unreadEntries.length === 0) return null;

  const [conversationId, count] = unreadEntries[0];
  const meta = metaMap[conversationId] || {};

  const type = String(meta.conversationType || "").toLowerCase();
  const workspaceId = meta.workspaceId || "";
  const projectId = meta.projectId || "";

  let href = "/workspaces";
  let label = "New chat messages";

  if (type === "direct" && workspaceId && projectId) {
    href = `/workspaces/${workspaceId}/projects/${projectId}/chat?mode=personal&conversationId=${conversationId}`;
    label = "New personal chat messages";
  } else if (type === "project" && workspaceId && projectId) {
    href = `/workspaces/${workspaceId}/projects/${projectId}/chat`;
    label = "New project chat messages";
  } else if (workspaceId) {
    href = `/workspaces/${workspaceId}/chat`;
    label = "New workspace chat messages";
  }

  return {
    conversationId,
    count: Number(count),
    href,
    label,
  };
}
