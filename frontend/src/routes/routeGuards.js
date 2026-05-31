export const BLOCKED_ORG_FETCH_PATHS = ['/404', '/unauthorized', '/500', '/maintenance'];

export const isBlockedOrgFetchPath = (pathname) =>
  BLOCKED_ORG_FETCH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );