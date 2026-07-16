import { useQuery } from '@tanstack/react-query';
import { userSettingsApi } from '../../utils/api';
import useOrganizationStore from '../../stores/organizationStore';
import useAuthStore from '../../stores/authStore';

export const useMyProfile = () => {
  const organizationId = useOrganizationStore((state) => state.organization?.id ?? null);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['user', 'me', 'profile', organizationId],
    queryFn: () => userSettingsApi.getProfile(organizationId),
    enabled: Boolean(user && token && organizationId),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};
