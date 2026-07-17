import { useMemo } from 'react';

import { useAuth } from './useAuth';

/**
 * Central rule for "may this user push / change content?".
 *
 * Centralized permission tiers:
 * - Basic actions (chat, network, event registration, donations): logged in at level 0+
 * - Contribute actions (forum posting/replying, article/achievement requests): level 2+
 * - Org manager actions (admin/staff management affordances in the current org): level 4
 *
 * Returns:
 *  - canUseBasicActions: boolean — true when logged in and allowed to use basic actions
 *  - canContribute: boolean — true when the user may submit community content
 *  - isAuthenticated: boolean
 *  - isPrivileged: boolean — backward-compatible alias for org manager
 *  - isOrgManager: boolean — effective verification level 4
 *  - verificationLevel: number
 */
const MIN_CONTRIBUTE_VERIFICATION_LEVEL = 2;
const ORG_MANAGER_VERIFICATION_LEVEL = 4;

export const useCanContribute = () => {
  const { isAuthenticated, verificationLevel } = useAuth();

  return useMemo(() => {
    const level = verificationLevel ?? 0;
    const isOrgManager = isAuthenticated && level >= ORG_MANAGER_VERIFICATION_LEVEL;
    const canUseBasicActions = isAuthenticated;
    const canContribute =
      isAuthenticated && level >= MIN_CONTRIBUTE_VERIFICATION_LEVEL;

    return {
      canUseBasicActions,
      canContribute,
      isAuthenticated,
      isPrivileged: isOrgManager,
      isOrgManager,
      verificationLevel: level,
    };
  }, [isAuthenticated, verificationLevel]);
};
