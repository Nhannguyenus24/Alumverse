import { create } from 'zustand';

/**
 * Global reactive source for the notification-bell unread count.
 *
 * The bell (Notification.jsx) still owns fetching/marking-read; it mirrors its
 * derived unread count into this store via `setCount` so app-wide consumers
 * (e.g. the favicon red-dot) can react without duplicating the fetch. Not
 * persisted — reflects the current session only.
 */
const useNotificationUnreadStore = create((set) => ({
  count: 0,
  setCount: (count) => set({ count }),
}));

export default useNotificationUnreadStore;
