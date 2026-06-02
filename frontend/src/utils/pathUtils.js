/**
 * Normalizes a pathname by removing the organization slug prefix if present.
 * 
 * @param {string} pathname - The current location pathname.
 * @param {string} [slug] - The organization slug from route params.
 * @returns {string} The normalized pathname (e.g., "/home" instead of "/org-slug/home").
 */
export const getNormalizedPathname = (pathname, slug) => {
  if (!slug) return pathname;

  const slugPrefix = `/${slug}`;

  if (pathname === slugPrefix) return "/";

  if (pathname.startsWith(`${slugPrefix}/`)) {
    return pathname.slice(slugPrefix.length) || "/";
  }

  return pathname;
};
