import { create } from 'zustand';
import { surveyApi } from '../utils/api';

const DISMISS_KEY = 'dismissed_surveys';

const getDismissed = () => {
  try { return new Set(JSON.parse(sessionStorage.getItem(DISMISS_KEY) || '[]')); }
  catch { return new Set(); }
};
const addDismissed = (id) => {
  const set = getDismissed();
  set.add(id);
  sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...set]));
};

/**
 * Shared state for open surveys the current user has not answered yet.
 *
 * - `pending` drives the badge count on the floating survey action so the user always
 *   knows there are surveys to fill, even after dismissing the popup.
 * - The auto-popup only fires when there is at least one survey not dismissed
 *   this session, so the user is not nagged repeatedly.
 * - The floating action can always re-open the modal (`openModal`) to list every
 *   pending survey again.
 */
const useSurveyPromptStore = create((set, get) => ({
  pending: [],
  open: false,
  loaded: false,

  fetchPending: async () => {
    try {
      const list = await surveyApi.getActiveSurveys();
      const pending = (list || []).filter((s) => !s.hasSubmitted);
      set({ pending, loaded: true });

      const dismissed = getDismissed();
      const fresh = pending.filter((s) => !dismissed.has(s.id));
      if (fresh.length > 0) set({ open: true });
    } catch { /* ignore — not critical */ }
  },

  openModal: () => set({ open: true }),
  closeModal: () => set({ open: false }),

  dismissAll: () => {
    get().pending.forEach((s) => addDismissed(s.id));
    set({ open: false });
  },

  // Called after the user opens a survey to fill it; keep it dismissed so the
  // popup does not re-appear, but leave it in `pending` until they submit.
  markOpened: (id) => {
    addDismissed(id);
    set({ open: false });
  },

  reset: () => set({ pending: [], open: false, loaded: false }),
}));

export default useSurveyPromptStore;
