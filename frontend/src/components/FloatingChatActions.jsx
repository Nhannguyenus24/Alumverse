import { Suspense, lazy, useCallback, useState } from 'react';
import { Box } from '@mui/material';
import { useLocation, useParams } from 'react-router';

import ChatFloatingButton from './ChatFloatingButton';
import { getNormalizedPathname } from '../utils/pathUtils';
import { useFeatureEnabled } from '../hooks/useFeatureFlags';

const HIDDEN_PATHS = ['/chat'];
const FitBot = lazy(() => import('./FitBot'));

export default function FloatingChatActions() {
  const location = useLocation();
  const { slug } = useParams();
  const normalizedPath = getNormalizedPathname(location.pathname, slug);
  const fitbotEnabled = useFeatureEnabled('fitbot');
  const [activeWidget, setActiveWidget] = useState(null);

  const openMessages = useCallback(() => setActiveWidget('messages'), []);
  const openFitBot = useCallback(() => setActiveWidget('fitbot'), []);
  const closeWidget = useCallback((widget) => {
    setActiveWidget((current) => (current === widget ? null : current));
  }, []);

  if (HIDDEN_PATHS.includes(normalizedPath)) {
    return null;
  }

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: 90,
          right: 20,
          zIndex: 999,
        }}
      >
        <ChatFloatingButton
          isOpen={activeWidget === 'messages'}
          onOpen={openMessages}
          onClose={() => closeWidget('messages')}
        />
      </Box>
      {fitbotEnabled && (
        <Suspense fallback={null}>
          <FitBot
            isOpen={activeWidget === 'fitbot'}
            isBlocked={activeWidget === 'messages'}
            onOpen={openFitBot}
            onClose={() => closeWidget('fitbot')}
          />
        </Suspense>
      )}
    </>
  );
}
