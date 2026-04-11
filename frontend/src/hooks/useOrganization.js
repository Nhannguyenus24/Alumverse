import { useContext } from 'react';
import { OrganizationContext } from '../contexts/OrganizationContext';

/**
 * Hook to access organization context
 * Returns organization data, loading state, error, and utility functions
 */
export const useOrganization = () => {
  const context = useContext(OrganizationContext);

  if (!context) {
    throw new Error(
      'useOrganization must be used within OrganizationProvider'
    );
  }

  return context;
};

/**
 * Extract organization ID from context for API calls
 * Ensures organization is loaded before using the ID
 */
export const useOrganizationId = () => {
  const { organization, loading, error } = useOrganization();

  if (loading) {
    return { id: null, loading: true, error: null };
  }

  if (error || !organization) {
    return { 
      id: null, 
      loading: false, 
      error: error || { message: 'Organization not found' } 
    };
  }

  return { 
    id: organization.id, 
    loading: false, 
    error: null 
  };
};
