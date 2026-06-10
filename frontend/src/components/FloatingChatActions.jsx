import { Box } from '@mui/material';
import { useLocation, useParams } from 'react-router';

import ChatFloatingButton from './ChatFloatingButton';
import { getNormalizedPathname } from '../utils/pathUtils';

const HIDDEN_PATHS = ['/chat'];

export default function FloatingChatActions() {
  const location = useLocation();
  const { slug } = useParams();
  const normalizedPath = getNormalizedPathname(location.pathname, slug);

  if (HIDDEN_PATHS.includes(normalizedPath)) {
    return null;
  }

  const isHomePage = normalizedPath === '/';

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        right: isHomePage ? 90 : 20,
        zIndex: 999,
      }}
    >
      <ChatFloatingButton />
    </Box>
  );
}
