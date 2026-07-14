import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import i18next from 'i18next';

import apiClient from '../utils/axios';
import useAuthStore from '../stores/authStore';
import useOrganizationStore from '../stores/organizationStore';
import useChatUnreadStore from '../stores/chatUnreadStore';
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
export const useServerSentEvents = ({ onNotify } = {}) => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const { showError, showSuccess, showWarning } = useNotification();

  // Keep onNotify in a ref so changing it never tears down the SSE connection.
  const onNotifyRef = useRef(onNotify);
  onNotifyRef.current = onNotify;

  useEffect(() => {
    if (!token) return undefined;

    const source = new EventSource(resolveSseUrl(token));

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

    const handleNewMessage = () => {
      useChatUnreadStore.getState().increment();
      onNotifyRef.current?.();
    };

    source.addEventListener('feature-toggled', handleFeatureToggled);
    source.addEventListener('verification-updated', handleVerificationUpdated);
    source.addEventListener('user-banned', handleUserBanned);
    source.addEventListener('new-message', handleNewMessage);
    source.onerror = () => {
      // EventSource reconnects automatically; log only for diagnostics.
      if (source.readyState === EventSource.CLOSED) {
        console.warn('SSE connection closed');
      }
    };

    return () => {
      source.removeEventListener('feature-toggled', handleFeatureToggled);
      source.removeEventListener('verification-updated', handleVerificationUpdated);
      source.removeEventListener('user-banned', handleUserBanned);
      source.removeEventListener('new-message', handleNewMessage);
      source.close();
    };
  }, [token, queryClient, showError, showSuccess, showWarning]);
};
