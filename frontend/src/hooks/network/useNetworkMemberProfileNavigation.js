import { useCallback } from 'react';

import { useOrgNavigate } from '../useOrgNavigate';

export function useNetworkMemberProfileNavigation(userId) {
  const navigate = useOrgNavigate();

  const navigateToProfile = useCallback(() => {
    if (userId == null) return;
    navigate(`/profile/${userId}`);
  }, [navigate, userId]);

  const handleCardKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        navigateToProfile();
      }
    },
    [navigateToProfile],
  );

  const stopActionPropagation = useCallback((event) => {
    event.stopPropagation();
  }, []);

  return { navigateToProfile, handleCardKeyDown, stopActionPropagation };
}
