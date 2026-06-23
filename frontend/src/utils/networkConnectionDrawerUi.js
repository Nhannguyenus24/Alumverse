import { CONVERSATION_REQUEST_STATUS } from '../constants/conversationRequestStatus';
import { formatDateTime } from './dateFormatter';

function mapLatestMessage(latestMessage) {
  if (!latestMessage) return [];

  return [
    {
      id: latestMessage.id,
      body: latestMessage.content,
      senderMemberId: latestMessage.senderMemberId,
    },
  ];
}

function isCooldownExpired(cooldownUntil) {
  if (!cooldownUntil) return false;
  return Date.now() >= new Date(cooldownUntil).getTime();
}

/**
 * @param {{
 *   status: string;
 *   cooldownUntil?: string | null;
 *   latestMessage?: object | null;
 * } | null} connectionStatus
 * @param {function} t - i18next translation function
 */
export function resolveConnectionDrawerState(connectionStatus, t) {
  if (connectionStatus == null) {
    return {
      banner: {
        severity: 'info',
        text: t('network:drawer_banner_first_message'),
      },
      canCompose: true,
      singleMessageOnly: true,
      messages: [],
      emptyHint: t('network:drawer_empty_first'),
      composerPlaceholder: t('network:drawer_placeholder_type'),
    };
  }

  const { status, cooldownUntil, latestMessage } = connectionStatus;
  const messages = mapLatestMessage(latestMessage);

  if (status === CONVERSATION_REQUEST_STATUS.PENDING) {
    return {
      banner: {
        severity: 'info',
        text: t('network:drawer_banner_pending'),
      },
      canCompose: false,
      singleMessageOnly: false,
      messages,
      emptyHint: t('network:no_messages_yet'),
      composerPlaceholder: t('network:drawer_placeholder_disabled'),
    };
  }

  if (status === CONVERSATION_REQUEST_STATUS.ACCEPTED) {
    return {
      banner: {
        severity: 'success',
        text: t('network:drawer_banner_accepted'),
      },
      canCompose: false,
      singleMessageOnly: false,
      messages,
      emptyHint: t('network:no_messages_yet'),
      composerPlaceholder: t('network:drawer_placeholder_disabled'),
    };
  }

  if (status === CONVERSATION_REQUEST_STATUS.REJECTED) {
    const cooldownExpired = isCooldownExpired(cooldownUntil);

    if (cooldownExpired) {
      return {
        banner: {
          severity: 'info',
          text: t('network:drawer_banner_retry'),
        },
        canCompose: true,
        singleMessageOnly: true,
        messages,
        emptyHint: t('network:no_messages_yet'),
        composerPlaceholder: t('network:drawer_placeholder_type'),
      };
    }

    return {
      banner: {
        severity: 'warning',
        text: t('network:drawer_banner_rejected', { datetime: formatDateTime(cooldownUntil, '') }),
      },
      canCompose: false,
      singleMessageOnly: false,
      messages,
      emptyHint: t('network:no_messages_yet'),
      composerPlaceholder: t('network:drawer_placeholder_disabled'),
    };
  }

  return {
    banner: null,
    canCompose: false,
    singleMessageOnly: false,
    messages,
    emptyHint: t('network:no_messages_yet'),
    composerPlaceholder: t('network:drawer_placeholder_disabled'),
  };
}

export function isComposerEnabled({ canCompose, singleMessageOnly, sentInSession }) {
  if (!canCompose) return false;
  if (singleMessageOnly && sentInSession) return false;
  return true;
}
