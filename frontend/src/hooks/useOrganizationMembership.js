import { useContext } from 'react';
import { OrganizationMembershipContext } from '../contexts/OrganizationMembershipContext';

export const useOrganizationMembership = () => {
  const context = useContext(OrganizationMembershipContext);

  if (!context) {
    throw new Error('useOrganizationMembership must be used within OrganizationMembershipProvider');
  }

  return context;
};
