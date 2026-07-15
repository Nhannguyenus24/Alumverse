import { useMemo } from 'react';

import { useAuth } from './useAuth';

/**
 * Central rule for "may this user push / change content?".
 *
 * Content-changing actions (posting, commenting, registering for events,
 * sending connection requests, messaging, etc.) are reserved for org-verified
 * alumni — i.e. `verificationLevel >= 2`. ADMIN always bypasses the gate.
 * STAFF only bypasses inside its assigned organization because the backend
 * returns effective verificationLevel 4 there; in other organizations it falls
 * back to level 2 and behaves like a regular verified alumnus.
 *
 * Returns:
 *  - canContribute: boolean — true when the user may perform write actions
 *  - isAuthenticated: boolean
 *  - isPrivileged: boolean — ADMIN or STAFF
 *  - verificationLevel: number
 */
const MIN_CONTRIBUTE_VERIFICATION_LEVEL = 2;

export const useCanContribute = () => {
  const { isAuthenticated, user, verificationLevel } = useAuth();

  return useMemo(() => {
    const role = user?.role ?? null;
    const level = verificationLevel ?? 0;
    const isPrivileged = role === 'ADMIN' || (role === 'STAFF' && level >= 4);
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
