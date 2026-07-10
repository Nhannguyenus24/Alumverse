import { useCallback, useMemo } from 'react';
import useOrganizationStore from '../stores/organizationStore';
import { isFeatureEnabled, parseFeaturesConfig } from '../utils/featureFlags';

/**
 * Reactive access to the current organization's feature flags.
 * Backed by the organization store (populated by useOrganization), so it stays
 * in sync when the org is (re)fetched or switched.
 *
 * @returns {{ isEnabled: (featureName: string) => boolean, featuresConfig: object }}
 */
export const useFeatureFlags = () => {
  const rawConfig = useOrganizationStore((state) => state.organization?.featuresConfig);
  const featuresConfig = useMemo(() => parseFeaturesConfig(rawConfig), [rawConfig]);
  const isEnabled = useCallback(
    (featureName) => featuresConfig?.features_config?.[featureName]?.enabled ?? true,
    [featuresConfig]
  );
  return { isEnabled, featuresConfig };
};

/**
 * Convenience hook for gating a single feature.
 * Defaults to `true` (enabled) when the flag or organization is not present.
 */
export const useFeatureEnabled = (featureName) => {
  const rawConfig = useOrganizationStore((state) => state.organization?.featuresConfig);
  return useMemo(() => isFeatureEnabled(rawConfig, featureName), [rawConfig, featureName]);
};

export default useFeatureFlags;
