import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import i18next from 'i18next';

import apiClient, {
  refreshSessionAccessToken,
  syncAuthStoreFromAccessToken,
} from '../utils/axios';
import useAuthStore from '../stores/authStore';
import useOrganizationStore from '../stores/organizationStore';
import useChatUnreadStore from '../stores/chatUnreadStore';
import useActiveChatStore from '../stores/activeChatStore';
import {
  applyIncomingMessageToChatLists,
  resetChatUnreadInLists,
} from './chat/invalidateChatQueries';
import { chatApi } from '../utils/api';
import { useNotification } from './useNotification';

/**
 * Resolve the SSE endpoint. `EventSource` cannot send an `Authorization` header,
 * so the JWT is appended as a `?token=` query param (mirroring the chat WebSocket).
 *
 * We connect straight to the backend origin (VITE_API_BASE_URL) rather than the
 * same-origin `/api` path: in production `/api` is served through a Vercel rewrite
 * proxy that buffers streaming responses, which would break the long-lived SSE
 * stream. In dev, VITE_API_BASE_URL is unset so it falls back to the same-origin
 * `/api` path handled by the Vite proxy (which streams fine).
 */
const resolveSseUrl = (token) => {
  const explicit = import.meta.env.VITE_SSE_URL;
  const base = explicit || `${import.meta.env.VITE_API_BASE_URL || ''}/api/sse/connect`;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}token=${encodeURIComponent(token)}`;
};

const parseEvent = (event) => {
  try {
    return JSON.parse(event.data);
  } catch {
    return null;
  }
};

/**
 * Opens a single global Server-Sent Events connection for the logged-in user and
 * fans incoming events out to the relevant stores:
 *  - `feature-toggled`       → organizationStore.updateFeaturesConfig (live feature flags)
 *  - `verification-updated`  → authStore.setVerificationLevel
 *  - `user-banned`           → toast + logout
 *  - `new-message`           → chatUnreadStore.increment (message button badge)
 *
 * Must be mounted inside the QueryClient and Notistack providers. The connection is
 * (re)established whenever the access token changes and torn down on logout.
 */
/** DOM event phát lại khi backend đọc xong tài liệu của một yêu cầu xác thực. */
export const VERIFICATION_OCR_READY_EVENT = 'alumverse:verification-ocr-ready';

/**
 * DOM event phát khi có một thông báo mới đến qua SSE (vd: lời mời kết nối). Chuông
 * (Notification.jsx) tự fetch/poll nên nó lắng nghe sự kiện này để refetch ngay, giúp
 * số đếm chưa đọc nhảy tức thì thay vì phải chờ vòng poll kế tiếp.
 */
export const NOTIFICATIONS_UPDATED_EVENT = 'alumverse:notifications-updated';

export const useServerSentEvents = ({ onNotify } = {}) => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const { showError, showSuccess, showWarning, showInfo } = useNotification();

  // Keep onNotify in a ref so changing it never tears down the SSE connection.
  const onNotifyRef = useRef(onNotify);
  onNotifyRef.current = onNotify;

  useEffect(() => {
    if (!token) return undefined;

    const source = new EventSource(resolveSseUrl(token));

    // Chỉ cho phép refresh MỘT lần cho mỗi instance kết nối này. Khi backend trả 401
    // (token hết hạn), EventSource chuyển sang CLOSED và KHÔNG tự reconnect nữa, nên
    // ta phải chủ động refresh: thành công sẽ đổi authStore.token → effect chạy lại và
    // mở kết nối mới bằng token còn hạn (đồng thời cấp cho instance mới một lượt refresh).
    let didAttemptRefresh = false;

    const handleFeatureToggled = (event) => {
      const data = parseEvent(event);
      if (!data) return;
      useOrganizationStore.getState().updateFeaturesConfig(data.organizationId, data.featuresConfig);
    };

    const handleVerificationUpdated = (event) => {
      const data = parseEvent(event);
      if (!data) return;
      useAuthStore.getState().setVerificationLevel(data.verificationLevel);
      if (data.status === 'APPROVED') {
        showSuccess(i18next.t('common:sse_verification_approved'));
      } else if (data.status === 'REJECTED') {
        showWarning(i18next.t('common:sse_verification_rejected'));
      }
      onNotifyRef.current?.();
    };

    const handleUserBanned = async (event) => {
      const data = parseEvent(event) ?? {};
      showError(data.message || i18next.t('common:sse_account_banned'));
      try {
        await apiClient.post('/auth/logout');
      } catch {
        // best-effort: the account may already be blocked server-side
      } finally {
        queryClient.clear();
        useAuthStore.getState().reset();
      }
    };

    const handleNewMessage = (event) => {
      const data = parseEvent(event);
      // Older payload / parse failure: fall back to just bumping the global badge.
      if (!data || data.groupId == null) {
        useChatUnreadStore.getState().increment();
        onNotifyRef.current?.();
        return;
      }

      const chatId = data.groupId;
      const isActive = String(useActiveChatStore.getState().activeChatId) === String(chatId);

      // Live-update the left column (preview + last-message time → re-sort) and flag the
      // conversation as unread unless the user is currently reading it.
      const matched = applyIncomingMessageToChatLists(queryClient, {
        chatId,
        preview: data.preview,
        createdAt: data.createdAt,
        markUnread: !isActive,
      });

      // Not in any cached page (brand-new chat, or on a page we haven't loaded): refetch
      // the lists so the conversation shows up.
      if (!matched) {
        queryClient.invalidateQueries({ queryKey: ['groupChatList'] });
        queryClient.invalidateQueries({ queryKey: ['privateChatList'] });
      }
      // Keep the header's recent-previews dropdown fresh too.
      queryClient.invalidateQueries({ queryKey: ['recentChatPreviews'] });

      if (isActive) {
        // The user is looking at this conversation — keep the server read-state in sync
        // so the unread count doesn't resurface on the next full refetch.
        chatApi.markGroupAsRead(chatId).catch(() => {});
      } else {
        useChatUnreadStore.getState().increment();
      }
      onNotifyRef.current?.();
    };

    // Emitted to the reader's own connections when they mark a conversation read in
    // another tab; clear the unread marker here so open tabs stay consistent.
    const handleChatRead = (event) => {
      const data = parseEvent(event);
      if (!data || data.groupId == null) return;
      resetChatUnreadInLists(queryClient, data.groupId);
    };

    const handleEventReminder = (event) => {
      const data = parseEvent(event);
      if (!data) return;
      showInfo(data.message || i18next.t('common:sse_event_reminder'));
      onNotifyRef.current?.();
    };

    // Chỉ màn hình duyệt xác thực quan tâm sự kiện này, mà kết nối SSE thì dùng chung cả app,
    // nên phát lại thành DOM event để trang nào cần thì tự lắng nghe.
    const handleVerificationOcrReady = (event) => {
      const data = parseEvent(event);
      if (!data) return;
      window.dispatchEvent(new CustomEvent(VERIFICATION_OCR_READY_EVENT, { detail: data }));
    };

    const handleConnectionRequest = (event) => {
      const data = parseEvent(event);
      if (!data) return;
      showInfo(data.message || i18next.t('common:sse_connection_request'));
      // Chuông tự quản lý fetch, nên báo nó refetch để số chưa đọc cập nhật ngay.
      window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT, { detail: data }));
      onNotifyRef.current?.();
    };

    const handleTicketStatusUpdated = (event) => {
      const data = parseEvent(event);
      if (!data) return;
      if (data.status === 'CANCELLED') {
        showWarning(data.message || i18next.t('common:sse_ticket_cancelled'));
      } else if (data.status === 'BANNED') {
        showError(data.message || i18next.t('common:sse_ticket_banned'));
      }
      onNotifyRef.current?.();
    };

    source.addEventListener('feature-toggled', handleFeatureToggled);
    source.addEventListener('verification-updated', handleVerificationUpdated);
    source.addEventListener('user-banned', handleUserBanned);
    source.addEventListener('new-message', handleNewMessage);
    source.addEventListener('chat-read', handleChatRead);
    source.addEventListener('verification-ocr-ready', handleVerificationOcrReady);
    source.addEventListener('event-reminder', handleEventReminder);
    source.addEventListener('connection-request', handleConnectionRequest);
    source.addEventListener('ticket-status-updated', handleTicketStatusUpdated);
    source.onerror = () => {
      // readyState CONNECTING nghĩa là EventSource đang tự reconnect (mất mạng tạm thời,
      // proxy timeout...) — token vẫn còn hạn, cứ để nó tự lo, không làm gì.
      if (source.readyState !== EventSource.CLOSED) return;

      // CLOSED = server từ chối (thường là 401 token hết hạn) và sẽ không reconnect.
      // Chủ động refresh đúng một lần rồi để effect mở lại kết nối; thất bại thì thôi
      // (real API 401 qua axios interceptor sẽ lo việc logout).
      if (didAttemptRefresh) return;
      didAttemptRefresh = true;

      refreshSessionAccessToken()
        .then((data) => {
          syncAuthStoreFromAccessToken(data);
        })
        .catch(() => {
          console.warn('SSE connection closed; token refresh failed');
        });
    };

    return () => {
      source.removeEventListener('feature-toggled', handleFeatureToggled);
      source.removeEventListener('verification-updated', handleVerificationUpdated);
      source.removeEventListener('user-banned', handleUserBanned);
      source.removeEventListener('new-message', handleNewMessage);
      source.removeEventListener('chat-read', handleChatRead);
      source.removeEventListener('verification-ocr-ready', handleVerificationOcrReady);
      source.removeEventListener('event-reminder', handleEventReminder);
      source.removeEventListener('connection-request', handleConnectionRequest);
      source.removeEventListener('ticket-status-updated', handleTicketStatusUpdated);
      source.close();
    };
  }, [token, queryClient, showError, showSuccess, showWarning, showInfo]);
};
