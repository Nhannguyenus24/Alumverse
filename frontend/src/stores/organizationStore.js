import { create } from 'zustand';
import { organizationApi } from '../api/organizationApi';

const initialState = {
  currentSlug: null,
  organization: null,
  loading: false,
  error: null,
};

const useOrganizationStore = create((set) => ({
  ...initialState,

  setOrganization: (organization) => set({ organization }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  /**
   * Fetch organization data by slug
   * Clears old data when slug changes
   */
  fetchOrganization: async (slug) => {
    if (!slug) {
      set(initialState);
      return;
    }

    set((state) => ({
      ...state,
      loading: true,
      error: null,
      // If slug changed, clear old organization data
      ...(state.currentSlug !== slug && { organization: null }),
      currentSlug: slug,
    }));

    try {
      const organization = await organizationApi.getOrganizationBySlug(slug);
      set({
        organization,
        loading: false,
        error: null,
      });
    } catch (error) {
      set({
        organization: null,
        loading: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch organization',
      });
    }
  },

  /**
   * Reset store to initial state
   * Used when leaving organization context
   */
  reset: () => set(initialState),
}));

export default useOrganizationStore;
