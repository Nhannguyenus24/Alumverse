import { useQuery } from '@tanstack/react-query';
import apiClient from '../utils/axios';

/**
 * Fetch organization by slug - used mainly for initialization
 * Can be used for polling/refetching if needed
 */
export const useGetOrganizationBySlug = (slug, options = {}) => {
  return useQuery({
    queryKey: ['organization', slug],
    queryFn: async () => {
      const response = await apiClient.get(`/organizations/${slug}`);
      return response.data?.data; // ApiResponse structure
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    ...options,
  });
};

/**
 * Fetch all organizations
 */
export const useGetAllOrganizations = (options = {}) => {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const response = await apiClient.get('/organizations');
      return response.data?.data; // returns array of organizations
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    ...options,
  });
};
