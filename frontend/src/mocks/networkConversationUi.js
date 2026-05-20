import { CONVERSATION_STATUS, GREETING_MESSAGE_LIMIT } from './networkConversationConstants';
import {
  canSendMessage,
  countInitiatorMessages,
  isCurrentUserInitiator,
} from './networkConversationStore';

/**
 * Derive UI mode cho drawer.
 * @returns {'new'|'pending_initiator'|'pending_recipient'|'active'|'declined'}
 */
export function getConversationUiMode(conversation, currentMemberId) {
  const status = conversation?.status ?? CONVERSATION_STATUS.NONE;

  if (status === CONVERSATION_STATUS.DECLINED) return 'declined';
  if (status === CONVERSATION_STATUS.ACTIVE) return 'active';
  if (status === CONVERSATION_STATUS.NONE) return 'new';

  if (status === CONVERSATION_STATUS.PENDING) {
    return isCurrentUserInitiator(conversation, currentMemberId)
      ? 'pending_initiator'
      : 'pending_recipient';
  }

  return 'new';
}

export function getConversationBanner(mode, conversation, currentMemberId, peerName) {
  const name = peerName || 'Người này';

  switch (mode) {
    case 'new':
      return {
        severity: 'info',
        text: `Bạn có thể gửi tối đa ${GREETING_MESSAGE_LIMIT} tin nhắn lời chào. ${name} chấp nhận sau đó mới trò chuyện tự do.`,
      };
    case 'pending_initiator': {
      const sent = countInitiatorMessages(conversation, currentMemberId);
      return {
        severity: sent >= GREETING_MESSAGE_LIMIT ? 'warning' : 'info',
        text:
          sent >= GREETING_MESSAGE_LIMIT
            ? `Bạn đã gửi đủ ${GREETING_MESSAGE_LIMIT} lời chào. Vui lòng chờ phản hồi.`
            : `Đã gửi ${sent}/${GREETING_MESSAGE_LIMIT} lời chào. Chờ ${name} phản hồi.`,
      };
    }
    case 'pending_recipient':
      return {
        severity: 'info',
        text: `${name} muốn kết nối với bạn. Chấp nhận để trả lời.`,
      };
    case 'active':
      return {
        severity: 'success',
        text: 'Bạn đã kết nối — có thể nhắn tin bình thường.',
      };
    case 'declined':
      return {
        severity: 'error',
        text: 'Cuộc trò chuyện đã bị từ chối. Không thể gửi thêm tin nhắn.',
      };
    default:
      return null;
  }
}

export function getComposerPlaceholder(mode) {
  switch (mode) {
    case 'new':
      return 'Viết lời chào…';
    case 'pending_initiator':
      return 'Viết lời chào…';
    case 'active':
      return 'Nhập tin nhắn…';
    default:
      return 'Không thể gửi tin nhắn';
  }
}

export function isComposerEnabled(mode, conversation, currentMemberId) {
  if (mode === 'pending_recipient' || mode === 'declined') return false;
  return canSendMessage(conversation, currentMemberId).allowed;
}
