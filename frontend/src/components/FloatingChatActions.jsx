import { Suspense, lazy, useCallback, useState } from 'react';
import { Box } from '@mui/material';
import { useLocation, useParams } from 'react-router';

import ChatFloatingButton from './ChatFloatingButton';
import { getNormalizedPathname } from '../utils/pathUtils';

const HIDDEN_PATHS = ['/chat'];
const FitBot = lazy(() => import('./FitBot'));

export default function FloatingChatActions() {
  const location = useLocation();
  const { slug } = useParams();
  const normalizedPath = getNormalizedPathname(location.pathname, slug);
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
          bottom: 20,
          right: 90,
          zIndex: 999,
        }}
      >
        <ChatFloatingButton
          isOpen={activeWidget === 'messages'}
          onOpen={openMessages}
          onClose={() => closeWidget('messages')}
        />
      </Box>
      <Suspense fallback={null}>
        <FitBot
          isOpen={activeWidget === 'fitbot'}
          isBlocked={activeWidget === 'messages'}
          onOpen={openFitBot}
          onClose={() => closeWidget('fitbot')}
        />
      </Suspense>
    </>
  );
}
