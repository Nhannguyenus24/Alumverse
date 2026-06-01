import { create } from 'zustand';
import { organizationApi } from '../utils/api';

const organizationDefaults = {
  id: null,
  name: '',
  slug: '',
  logoUrl: null,
  brandConfig: '{}',
  featuresConfig: '{}',
  programs: '[]',
  majors: '[]',
  status: null,
  createdAt: null,
};

const normalizeOrganization = (organization) => {
  if (!organization) return null;

  return {
    ...organizationDefaults,
    ...organization,
  };
};

const initialState = {
  currentSlug: null,
  organization: null,
  loading: false,
  error: null,
  statusCode: null,
};

const useOrganizationStore = create((set) => ({
  ...initialState,

  setOrganization: (organization) => set({ organization: normalizeOrganization(organization) }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setStatusCode: (statusCode) => set({ statusCode }),

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
      statusCode: null,
      // If slug changed, clear old organization data
      ...(state.currentSlug !== slug && { organization: null }),
      currentSlug: slug,
    }));

    try {
      const organization = await organizationApi.getOrganizationBySlug(slug);

      if (!organization) {
        set({
          organization: null,
          loading: false,
          error: 'Invalid organization response',
          statusCode: 200,
        });
        return;
      }

      set({
        organization: normalizeOrganization(organization),
        loading: false,
        error: null,
        statusCode: 200,
      });
    } catch (error) {
      const statusCode = error?.response?.status ?? null;

      set({
        organization: null,
        loading: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch organization',
        statusCode,
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
