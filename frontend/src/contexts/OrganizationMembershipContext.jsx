import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { getOrganizationMembershipDetails } from '../api/userApi';
import { useAuth } from '../hooks/useAuth';
import { useOrganization } from '../hooks/useOrganization';

export const OrganizationMembershipContext = createContext(null);

export const OrganizationMembershipProvider = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { organization, loading: organizationLoading } = useOrganization();

  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requiresRegistration, setRequiresRegistration] = useState(false);

  const refreshMembership = useCallback(async () => {
    console.info('[OrgMembershipProvider] refreshMembership called', {
      authLoading,
      organizationLoading,
      isAuthenticated,
      organizationId: organization?.id,
    });

    if (authLoading || organizationLoading) {
      console.info('[OrgMembershipProvider] Waiting for auth/org loading before membership check');
      setLoading(true);
      return;
    }

    if (!isAuthenticated) {
      console.info('[OrgMembershipProvider] User is not authenticated, skip membership check');
      setMembership(null);
      setError(null);
      setRequiresRegistration(false);
      setLoading(false);
      return;
    }

    const organizationId = organization?.id;
    if (!organizationId) {
      console.warn('[OrgMembershipProvider] Missing organizationId, force registration');
      setMembership(null);
      setError({ message: 'Organization not found' });
      setRequiresRegistration(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getOrganizationMembershipDetails(organizationId);
      const membershipData = response?.data?.data ?? null;
      const verificationLevel = Number(membershipData?.verificationLevel ?? 0);
      const shouldRequireRegistration = !membershipData || verificationLevel === 0;

      console.info('[OrgMembershipProvider] Membership fetched', {
        organizationId,
        membershipId: membershipData?.id,
        verificationLevel,
        requiresRegistration: shouldRequireRegistration,
      });

      setMembership(membershipData);
      setRequiresRegistration(shouldRequireRegistration);
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || err?.message || 'Failed to fetch organization membership';

      console.error('[OrgMembershipProvider] Membership fetch failed, force registration', {
        organizationId,
        status,
        message,
      });

      setMembership(null);
      setError({ status, message });
      // No membership record (or backend table/data issue) -> force registration flow.
      setRequiresRegistration(true);
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, organization?.id, organizationLoading]);

  useEffect(() => {
    refreshMembership();
  }, [refreshMembership]);

  const value = useMemo(
    () => ({
      membership,
      loading,
      error,
      requiresRegistration,
      refreshMembership,
    }),
    [membership, loading, error, requiresRegistration, refreshMembership]
  );

  return (
    <OrganizationMembershipContext.Provider value={value}>
      {children}
    </OrganizationMembershipContext.Provider>
  );
};
