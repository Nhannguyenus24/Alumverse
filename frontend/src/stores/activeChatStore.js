import { create } from 'zustand';

/**
 * Tracks which conversation is currently open on the chat page.
 *
 * The global SSE handler (see useServerSentEvents) lives outside the chat page and
 * has no access to its React state, yet it needs to know the open conversation so an
 * incoming `new-message` for that conversation is NOT counted as unread (the user is
 * already reading it). ChatPage keeps this store in sync with its `activeChatId` and
 * resets it on unmount. Not persisted — it only reflects the live UI.
 */
const useActiveChatStore = create((set) => ({
  activeChatId: null,
  setActiveChatId: (activeChatId) => set({ activeChatId }),
}));

export default useActiveChatStore;
