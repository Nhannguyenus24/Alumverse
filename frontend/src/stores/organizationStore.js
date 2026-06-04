import { create } from 'zustand';
import { organizationApi } from '../utils/api';

const organizationDefaults = {
  id: null,
  name: '',
  slug: '',
  logoUrl: null,
  brandConfig: {
    logo_url: null,
    favicon_url: null,
    hero_banner_url: null,
    theme_colors: {
      primary: '',
      secondary: '',
      accent: '',
    },
  },
  featuresConfig: {
    site_identity: {
      site_title: '',
      slug: '',
      introduction: {
        tagline: '',
        description: '',
      },
    },
    brand_config: {
      logo_url: null,
      favicon_url: null,
      hero_banner_url: null,
      theme_colors: {
        primary: '',
        secondary: '',
        accent: '',
      },
    },
    features_config: {},
    privacy_settings: {
      visibility_mode: 'PUBLIC',
      homepage_layout: [],
    },
  },
  programs: [],
  majors: [],
  status: null,
  createdAt: null,
};

const normalizeOrganization = (organization) => {
  if (!organization) return null;

  const safeParse = (val, fallback) => {
    if (!val) return fallback;
    if (typeof val === 'object') return val;
    try {
      const parsed = JSON.parse(val);
      return typeof parsed === 'object' ? parsed : fallback;
    } catch (e) {
      return fallback;
    }
  };

  const normalized = {
    ...organizationDefaults,
    ...organization,
    brandConfig: safeParse(organization.brandConfig, organizationDefaults.brandConfig),
    featuresConfig: safeParse(organization.featuresConfig, organizationDefaults.featuresConfig),
    programs: safeParse(organization.programs, organizationDefaults.programs),
    majors: safeParse(organization.majors, organizationDefaults.majors),
  };

  // Deep merge for featuresConfig to ensure nested defaults exist
  normalized.featuresConfig = {
    ...organizationDefaults.featuresConfig,
    ...normalized.featuresConfig,
    site_identity: {
      ...organizationDefaults.featuresConfig.site_identity,
      ...(normalized.featuresConfig.site_identity || {}),
      introduction: {
        ...organizationDefaults.featuresConfig.site_identity.introduction,
        ...((normalized.featuresConfig.site_identity || {}).introduction || {}),
      },
    },
    brand_config: {
      ...organizationDefaults.featuresConfig.brand_config,
      ...(normalized.featuresConfig.brand_config || {}),
      theme_colors: {
        ...organizationDefaults.featuresConfig.brand_config.theme_colors,
        ...((normalized.featuresConfig.brand_config || {}).theme_colors || {}),
      },
    },
    privacy_settings: {
      ...organizationDefaults.featuresConfig.privacy_settings,
      ...(normalized.featuresConfig.privacy_settings || {}),
    },
  };

  return normalized;
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

      if (!organization || !organization.id) {
        set({
          organization: null,
          loading: false,
          error: 'Tổ chức không tồn tại hoặc dữ liệu không hợp lệ',
          statusCode: 404,
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
