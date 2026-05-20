import { useQuery } from '@tanstack/react-query';
import { userSettingsApi } from '../../api/userSettingsApi';

export const useMyProfile = () =>
  useQuery({
    queryKey: ['user', 'me', 'profile'],
    queryFn: () => userSettingsApi.getProfile(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
