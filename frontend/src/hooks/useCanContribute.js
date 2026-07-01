import { useMemo } from 'react';

import { useAuth } from './useAuth';

/**
 * Central rule for "may this user push / change content?".
 *
 * Content-changing actions (posting, commenting, registering for events,
 * sending connection requests, messaging, etc.) are reserved for org-verified
 * alumni — i.e. `verificationLevel >= 2`. Privileged roles (ADMIN, STAFF)
 * always bypass the gate, mirroring the existing `isGuest` convention used in
 * the alumni forum.
 *
 * Returns:
 *  - canContribute: boolean — true when the user may perform write actions
 *  - isAuthenticated: boolean
 *  - isPrivileged: boolean — ADMIN or STAFF
 *  - verificationLevel: number
 */
export const MIN_CONTRIBUTE_VERIFICATION_LEVEL = 2;

export const useCanContribute = () => {
  const { isAuthenticated, user, verificationLevel } = useAuth();

  return useMemo(() => {
    const role = user?.role ?? null;
    const isPrivileged = role === 'ADMIN' || role === 'STAFF';
    const level = verificationLevel ?? 0;
    const canContribute =
      isAuthenticated && (isPrivileged || level >= MIN_CONTRIBUTE_VERIFICATION_LEVEL);

    return {
      canContribute,
      isAuthenticated,
      isPrivileged,
      verificationLevel: level,
    };
  }, [isAuthenticated, user?.role, verificationLevel]);
};

export default useCanContribute;
