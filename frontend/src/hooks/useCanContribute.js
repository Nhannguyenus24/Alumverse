import { useMemo } from 'react';

import { useAuth } from './useAuth';
import useOrganizationStore from '../stores/organizationStore';

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
  const { isAuthenticated, user, verificationLevel } = useAuth();
  const currentOrganizationId = useOrganizationStore((state) => state.organization?.id ?? null);

  return useMemo(() => {
    const level = verificationLevel ?? 0;
    const role = String(user?.role ?? '').toUpperCase();
    const tokenOrganizationId = user?.organizationId ?? null;
    const isCurrentOrganization =
      currentOrganizationId != null &&
      tokenOrganizationId != null &&
      Number(currentOrganizationId) === Number(tokenOrganizationId);
    const isAdmin = role === 'ADMIN';
    const isCurrentOrgStaffManager =
      role === 'STAFF' &&
      level >= ORG_MANAGER_VERIFICATION_LEVEL &&
      isCurrentOrganization;
    const isOrgManager = isAuthenticated && (isAdmin || isCurrentOrgStaffManager);
    const canUseBasicActions = isAuthenticated;
    const canContribute =
      isAuthenticated &&
      (isAdmin || isCurrentOrgStaffManager ||
        (role === 'USER' && level >= MIN_CONTRIBUTE_VERIFICATION_LEVEL && isCurrentOrganization));

    return {
      canUseBasicActions,
      canContribute,
      isAuthenticated,
      isPrivileged: isOrgManager,
      isOrgManager,
      verificationLevel: level,
    };
  }, [currentOrganizationId, isAuthenticated, user, verificationLevel]);
};
