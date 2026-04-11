import { Navigate, useLocation } from 'react-router';
import { useEffect } from 'react';
import LoadingScreen from '../components/LoadingScreen';
import { useAuth } from '../hooks/useAuth';
import { useOrganization } from '../hooks/useOrganization';
import { useOrganizationMembership } from '../hooks/useOrganizationMembership';

const OrganizationMembershipGuard = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { slug, organization, loading: organizationLoading } = useOrganization();
  const { loading: membershipLoading, requiresRegistration } = useOrganizationMembership();

  useEffect(() => {
    console.info('[OrgMembershipGuard] Evaluate access', {
      path: location.pathname,
      slug,
      isAuthenticated,
      authLoading,
      organizationLoading,
      membershipLoading,
      requiresRegistration,
      organizationId: organization?.id,
    });
  }, [
    location.pathname,
    slug,
    isAuthenticated,
    authLoading,
    organizationLoading,
    membershipLoading,
    requiresRegistration,
    organization?.id,
  ]);

  if (authLoading || organizationLoading || (isAuthenticated && membershipLoading)) {
    console.info('[OrgMembershipGuard] Show loading while evaluating membership access');
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    console.info('[OrgMembershipGuard] User not authenticated, skip organization membership guard');
    return children;
  }

  const registrationPath = `/${slug}/auth/organization-registration`;
  const isOnRegistrationPage = location.pathname === registrationPath;

  if (requiresRegistration && !isOnRegistrationPage) {
    const orgIdQuery = organization?.id ? `?orgId=${organization.id}` : '';
    console.warn('[OrgMembershipGuard] Redirect to organization registration', {
      from: location.pathname,
      to: `${registrationPath}${orgIdQuery}`,
      reason: 'missing membership or verificationLevel = 0',
    });
    return <Navigate to={`${registrationPath}${orgIdQuery}`} replace state={{ from: location }} />;
  }

  if (requiresRegistration && isOnRegistrationPage) {
    console.info('[OrgMembershipGuard] Already on organization registration page');
  }

  return children;
};

export default OrganizationMembershipGuard;
