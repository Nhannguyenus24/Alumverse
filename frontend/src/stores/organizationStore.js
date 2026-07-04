import { create } from 'zustand';
import { organizationApi } from '../utils/api';
import useAuthStore from './authStore';
import apiClient, { syncAuthStoreFromAccessToken } from '../utils/axios';

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

const useOrganizationStore = create((set, get) => ({
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

    const { currentSlug: oldSlug } = get();

    set((state) => ({
      loading: true,
      error: null,
      statusCode: null,
      // If slug changed, clear old organization data
      ...(state.currentSlug !== slug && { organization: null }),
      currentSlug: slug,
    }));

    try {
      const organization = await organizationApi.getOrganizationBySlug(slug);

      if (!organization || !organization.id) {
        set({
          organization: null,
          loading: false,
          error: 'Organization not found or invalid data',
          statusCode: 404,
        });
        return;
      }

      const authState = useAuthStore.getState();
      const userOrgId = authState.user?.organizationId;

      if (authState.user && authState.user.role !== 'ADMIN') {
        // Switch organization if the user's token belongs to a different organization
        // This handles both direct navigation (oldSlug is null) and React Router navigation
        if (Number(userOrgId) !== Number(organization.id)) {
          try {
            const res = await apiClient.post(`/auth/switch-organization/${organization.id}`);
            syncAuthStoreFromAccessToken(res.data.data);
          } catch (err) {
            console.error("Failed to switch organization", err);
            // Do not force logout here.
            // If it's a 401, the axios interceptor handles session refresh/logout automatically.
            // If it's a 403 (e.g. user not a member of this new org), they should just remain logged in to their previous org.
          }
        }
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
