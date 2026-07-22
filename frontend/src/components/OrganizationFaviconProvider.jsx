import { useEffect } from 'react';
import useOrganizationStore from '../stores/organizationStore';

const DEFAULT_FAVICON = '/alumverse_logo/Logo_Main.png';

const extractFaviconUrl = (org) => {
  if (!org) return null;
  let url = null;

  // 1. Try brandConfig
  if (org.brandConfig) {
    try {
      const b = typeof org.brandConfig === 'string' ? JSON.parse(org.brandConfig) : org.brandConfig;
      url = b?.favicon_url || b?.faviconUrl;
    } catch (e) {}
  }

  // 2. Try featuresConfig.brand_config (where Admin UI saves it)
  if (!url && org.featuresConfig) {
    try {
      const f = typeof org.featuresConfig === 'string' ? JSON.parse(org.featuresConfig) : org.featuresConfig;
      const b = f?.brand_config || f?.brandConfig;
      url = b?.favicon_url || b?.faviconUrl;
    } catch (e) {}
  }

  return url || org.faviconUrl || org.favicon_url || null;
};

const setFaviconHref = (href) => {
  if (!href) return;
  const selectors = ["link[rel~='icon']", "link[rel~='shortcut icon']"];
  let links = document.querySelectorAll(selectors.join(','));

  if (links.length === 0) {
    const link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
    links = [link];
  }

  links.forEach((link) => {
    link.href = href;
  });
};

export default function OrganizationFaviconProvider() {
  const organization = useOrganizationStore((state) => state.organization);

  useEffect(() => {
    const customFavicon = extractFaviconUrl(organization);

    if (!customFavicon) {
      setFaviconHref(DEFAULT_FAVICON);
      return;
    }

    // Preload image to check for load failure/404 before applying
    const img = new Image();
    img.onload = () => {
      setFaviconHref(customFavicon);
    };
    img.onerror = () => {
      // Fallback to default AlumVerse favicon if custom favicon fails to load
      setFaviconHref(DEFAULT_FAVICON);
    };
    img.src = customFavicon;
  }, [organization]);

  return null;
}
