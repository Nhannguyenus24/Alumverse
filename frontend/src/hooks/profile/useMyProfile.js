import { useQuery } from '@tanstack/react-query';
import { userSettingsApi } from '../../utils/api';
import useOrganizationStore from '../../stores/organizationStore';

export const useMyProfile = () => {
  const organizationId = useOrganizationStore((state) => state.organization?.id ?? null);

  return useQuery({
    queryKey: ['user', 'me', 'profile', organizationId],
    queryFn: () => userSettingsApi.getProfile(organizationId),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};
