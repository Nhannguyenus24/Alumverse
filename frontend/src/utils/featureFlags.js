/**
 * Feature-flag helpers driven by an organization's `featuresConfig`.
 *
 * Shape produced by the backend (FeatureConfig):
 *   { features_config: { <featureKey>: { enabled: boolean, settings: {...} }, ... }, ... }
 *
 * A feature is considered ENABLED by default (`?? true`) so that a missing key or
 * an organization whose config has not loaded yet never hides functionality.
 */

// Canonical feature keys shared by the admin toggle UI and the consumer gates.
export const FEATURE_KEYS = ['mentorship', 'job', 'fund', 'events', 'forum', 'fitbot'];

/** Parse `featuresConfig`, which may be a JSON string, an object, or empty. */
export const parseFeaturesConfig = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

/** Whether a single feature is enabled for the given (raw or parsed) config. */
export const isFeatureEnabled = (featuresConfig, featureName) => {
  const cfg = parseFeaturesConfig(featuresConfig);
  return cfg?.features_config?.[featureName]?.enabled ?? true;
};

/**
 * Maps a nav item's `href` to the feature key that controls it. Entries not
 * listed here are always shown.
 */
export const NAV_FEATURE_MAP = {
  '/mentorship': 'mentorship',
  '/development/jobs': 'job',
  '/donations': 'fund',
  '/events': 'events',
  '/forum': 'forum',
};

/**
 * Remove nav items (and children) whose controlling feature is disabled.
 * @param {Array} items    Nav items from getMainNavItems.
 * @param {(key: string) => boolean} isEnabled Feature checker.
 */
export const filterNavItemsByFeatures = (items, isEnabled) =>
  items
    .filter((item) => {
      const key = NAV_FEATURE_MAP[item.href];
      return !key || isEnabled(key);
    })
    .map((item) => {
      if (!item.children?.length) return item;
      const children = item.children.filter((child) => {
        const key = NAV_FEATURE_MAP[child.href];
        return !key || isEnabled(key);
      });
      return { ...item, children };
    });
