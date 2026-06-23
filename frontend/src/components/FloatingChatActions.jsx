import { Suspense, lazy } from 'react';
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
        <ChatFloatingButton />
      </Box>
      <Suspense fallback={null}>
        <FitBot />
      </Suspense>
    </>
  );
}
