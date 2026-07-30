const BLOCKED_ORG_FETCH_PATHS = ['/404', '/unauthorized', '/500', '/maintenance'];

export const isBlockedOrgFetchPath = (pathname) =>
  BLOCKED_ORG_FETCH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

/** True when both org ids are present and refer to the same organization. */
export const isSameOrganization = (currentOrgId, tokenOrgId) =>
  currentOrgId != null &&
  tokenOrgId != null &&
  Number(currentOrgId) === Number(tokenOrgId);

/** Global admin area: `/admin`, `/admin/...`. */
export const isGlobalAdminPath = (pathname) => /^\/admin(?:\/|$)/.test(pathname);

/** Org-scoped admin area: `/:slug/admin`, `/:slug/admin/...`. */
export const isSlugAdminPath = (pathname) => /^\/[^/]+\/admin(?:\/|$)/.test(pathname);