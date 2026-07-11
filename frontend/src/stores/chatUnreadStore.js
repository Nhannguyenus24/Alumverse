import { create } from 'zustand';

/**
 * Tracks the number of unread chat messages surfaced on the message button badge.
 *
 * The count is driven by the global SSE stream (see useServerSentEvents): each
 * `new-message` event increments it, and opening the messages panel resets it.
 * It is intentionally not persisted — a fresh session starts at zero and the
 * badge reflects only messages received while the tab is open.
 */
const useChatUnreadStore = create((set) => ({
  unreadCount: 0,

  increment: (by = 1) => set((state) => ({ unreadCount: state.unreadCount + by })),
  reset: () => set({ unreadCount: 0 }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
}));

export default useChatUnreadStore;
