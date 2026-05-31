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
 */
export function resolveConnectionDrawerState(connectionStatus) {
  if (connectionStatus == null) {
    return {
      banner: {
        severity: 'info',
        text: 'Gửi tin nhắn đầu tiên để bắt đầu kết nối.',
      },
      canCompose: true,
      singleMessageOnly: true,
      messages: [],
      emptyHint: 'Chưa có tin nhắn. Hãy gửi lời chào đầu tiên.',
      composerPlaceholder: 'Nhập tin nhắn…',
    };
  }

  const { status, cooldownUntil, latestMessage } = connectionStatus;
  const messages = mapLatestMessage(latestMessage);

  if (status === CONVERSATION_REQUEST_STATUS.PENDING) {
    return {
      banner: {
        severity: 'info',
        text: 'Đang chờ người kia phản hồi. Bạn không thể gửi thêm tin nhắn lúc này.',
      },
      canCompose: false,
      singleMessageOnly: false,
      messages,
      emptyHint: 'Chưa có tin nhắn.',
      composerPlaceholder: 'Không thể gửi tin nhắn lúc này',
    };
  }

  if (status === CONVERSATION_REQUEST_STATUS.ACCEPTED) {
    return {
      banner: {
        severity: 'success',
        text: 'Hai người đã kết nối.',
      },
      canCompose: false,
      singleMessageOnly: false,
      messages,
      emptyHint: 'Chưa có tin nhắn.',
      composerPlaceholder: 'Không thể gửi tin nhắn lúc này',
    };
  }

  if (status === CONVERSATION_REQUEST_STATUS.REJECTED) {
    const cooldownExpired = isCooldownExpired(cooldownUntil);

    if (cooldownExpired) {
      return {
        banner: {
          severity: 'info',
          text: 'Bạn có thể gửi thêm 1 tin nhắn.',
        },
        canCompose: true,
        singleMessageOnly: true,
        messages,
        emptyHint: 'Chưa có tin nhắn.',
        composerPlaceholder: 'Nhập tin nhắn…',
      };
    }

    return {
      banner: {
        severity: 'warning',
        text: `Yêu cầu kết nối đã bị từ chối. Bạn có thể gửi lại sau ${formatDateTime(cooldownUntil, 'thời điểm cooldown')}.`,
      },
      canCompose: false,
      singleMessageOnly: false,
      messages,
      emptyHint: 'Chưa có tin nhắn.',
      composerPlaceholder: 'Không thể gửi tin nhắn lúc này',
    };
  }

  return {
    banner: null,
    canCompose: false,
    singleMessageOnly: false,
    messages,
    emptyHint: 'Chưa có tin nhắn.',
    composerPlaceholder: 'Không thể gửi tin nhắn lúc này',
  };
}

export function isComposerEnabled({ canCompose, singleMessageOnly, sentInSession }) {
  if (!canCompose) return false;
  if (singleMessageOnly && sentInSession) return false;
  return true;
}
