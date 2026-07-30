export const getOrganizationHeroBannerUrl = (organization) => {
  if (!organization) return null;

  let url = null;

  try {
    if (organization.brandConfig) {
      const brandConfig = typeof organization.brandConfig === 'string'
        ? JSON.parse(organization.brandConfig)
        : organization.brandConfig;
      url = brandConfig?.hero_banner_url || brandConfig?.heroBannerUrl || null;
    }
  } catch {
    url = null;
  }

  if (!url && organization.featuresConfig) {
    try {
      const featuresConfig = typeof organization.featuresConfig === 'string'
        ? JSON.parse(organization.featuresConfig)
        : organization.featuresConfig;
      const brandConfig = featuresConfig?.brand_config || featuresConfig?.brandConfig;
      url = brandConfig?.hero_banner_url || brandConfig?.heroBannerUrl || null;
    } catch {
      url = null;
    }
  }

  return url || organization.heroBannerUrl || organization.hero_banner_url || null;
};
