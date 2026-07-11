import { useServerSentEvents } from '../hooks/useServerSentEvents';

/**
 * Headless component that keeps the global Server-Sent Events connection alive for
 * the whole app. Mounted once near the root (inside the QueryClient and Notistack
 * providers) so realtime admin actions — feature toggles, verification changes,
 * bans — and new-message badges are handled regardless of the current route.
 */
const RealtimeEventsProvider = () => {
  useServerSentEvents();
  return null;
};

export default RealtimeEventsProvider;
