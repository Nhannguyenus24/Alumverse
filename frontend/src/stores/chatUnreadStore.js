import { create } from 'zustand';

/**
 * Tracks the number of unread chat messages surfaced on the message button badge.
 *
 * On initial load useServerSentEvents seeds it once from the server (the real
 * unread total), then the global SSE stream keeps it live: each `new-message`
 * event increments it, and opening the messages panel resets it. It is not
 * persisted — every fresh load re-seeds from the server rather than from storage.
 */
const useChatUnreadStore = create((set) => ({
  unreadCount: 0,

  increment: (by = 1) => set((state) => ({ unreadCount: state.unreadCount + by })),
  reset: () => set({ unreadCount: 0 }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
}));

export default useChatUnreadStore;
