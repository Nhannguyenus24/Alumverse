import { useServerSentEvents } from '../hooks/useServerSentEvents';
import { useNotificationEffects } from '../hooks/useNotificationEffects';

/**
 * Headless component that keeps the global Server-Sent Events connection alive for
 * the whole app. Mounted once near the root (inside the QueryClient and Notistack
 * providers) so realtime admin actions — feature toggles, verification changes,
 * bans — and new-message badges are handled regardless of the current route.
 *
 * It also owns the browser-tab notification effects (sound + title flash on a
 * realtime event, favicon red-dot while the bell has unread items).
 */
const RealtimeEventsProvider = () => {
  const notify = useNotificationEffects();
  useServerSentEvents({ onNotify: notify });
  return null;
};

export default RealtimeEventsProvider;
