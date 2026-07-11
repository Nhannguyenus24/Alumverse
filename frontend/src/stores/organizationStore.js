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
  contactPhone: null,
  contactEmail: null,
  departmentName: null,
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

/**
 * Deduplicate concurrent organization switches (StrictMode double-invoke,
 * re-renders, full-page reload racing with auth bootstrap). Multiple callers
 * targeting the same org share a single /auth/switch-organization request so we
 * never re-issue the access token more than once for one navigation. The refresh
 * token is never touched by a switch — only the access token is rotated.
 */
let switchInFlight = null; // { orgId, promise }

const switchOrganizationOnce = (orgId) => {
  if (switchInFlight && switchInFlight.orgId === orgId) {
    return switchInFlight.promise;
  }
  const promise = apiClient
    .post(`/auth/switch-organization/${orgId}`)
    .then((res) => {
      syncAuthStoreFromAccessToken(res.data.data);
    })
    .finally(() => {
      if (switchInFlight && switchInFlight.orgId === orgId) {
        switchInFlight = null;
      }
    });
  switchInFlight = { orgId, promise };
  return promise;
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

  /**
   * Replace the current organization's feature config in place. Driven by the
   * `feature-toggled` SSE event so an admin toggling a feature is reflected live
   * without a page reload. Ignored when no organization is loaded or the event
   * targets a different organization.
   */
  updateFeaturesConfig: (organizationId, featuresConfig) => set((state) => {
    const org = state.organization;
    if (!org) return {};
    if (organizationId != null && Number(org.id) !== Number(organizationId)) return {};
    return { organization: { ...org, featuresConfig } };
  }),

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

    // If slug changed, clear old organization data

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
            await switchOrganizationOnce(organization.id);
          } catch (err) {
            console.error("Failed to switch organization", err);
            // Do not force logout here. A switch only re-issues the access token and
            // never touches the refresh token, so a failed/duplicate switch leaves the
            // previous session intact; the user simply stays on their prior org.
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
