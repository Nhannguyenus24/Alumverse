import {
  CONVERSATION_STATUS,
  GREETING_MESSAGE_LIMIT,
} from './networkConversationConstants';
import {
  buildInitialConversationMap,
  MOCK_NETWORK_DEMO_MEMBERS,
  MOCK_SEED_CURRENT_MEMBER_ID,
} from './networkConversationMock';

let conversationMap = buildInitialConversationMap();
let nextMessageId = 1000;
let nextConversationId = 20000;

function cloneConversation(conversation) {
  return {
    ...conversation,
    messages: [...(conversation.messages ?? [])],
  };
}

export function resetNetworkConversationStore() {
  conversationMap = buildInitialConversationMap();
  nextMessageId = 1000;
  nextConversationId = 20000;
}

export function countInitiatorMessages(conversation, initiatorId) {
  if (!conversation?.messages?.length || initiatorId == null) return 0;
  return conversation.messages.filter((m) => m.senderMemberId === initiatorId).length;
}

function remapSeedSender(senderMemberId, currentMemberId, peerMemberId) {
  if (senderMemberId === MOCK_SEED_CURRENT_MEMBER_ID) return currentMemberId;
  if (senderMemberId === peerMemberId) return peerMemberId;
  return senderMemberId;
}

/** Giữ đúng vai trò demo khi user đăng nhập có id khác 100 */
function normalizeDemoConversation(conversation, currentMemberId) {
  const demo = MOCK_NETWORK_DEMO_MEMBERS.find((m) => m.memberId === conversation.peerMemberId);
  if (!demo || conversation.demoLocked) return conversation;

  const peerMemberId = conversation.peerMemberId;
  const messages = (conversation.messages ?? []).map((m) => ({
    ...m,
    senderMemberId: remapSeedSender(m.senderMemberId, currentMemberId, peerMemberId),
  }));

  switch (demo.demoCase) {
    case 'NONE':
      if (
        conversation.status !== CONVERSATION_STATUS.NONE ||
        (conversation.messages?.length ?? 0) > 0
      ) {
        return { ...conversation, messages };
      }
      return {
        ...conversation,
        status: CONVERSATION_STATUS.NONE,
        initiatedByMemberId: null,
        messages: [],
      };
    case 'PENDING_INITIATOR':
      return {
        ...conversation,
        initiatedByMemberId: currentMemberId,
        messages,
      };
    case 'PENDING_RECIPIENT':
      return {
        ...conversation,
        initiatedByMemberId: peerMemberId,
        messages,
      };
    case 'ACTIVE':
      return {
        ...conversation,
        messages,
      };
    case 'DECLINED':
      return {
        ...conversation,
        initiatedByMemberId: peerMemberId,
        messages,
      };
    default:
      return { ...conversation, messages };
  }
}

export function getConversation(peerMemberId, currentMemberId) {
  const existing = conversationMap.get(peerMemberId);
  if (existing) {
    const cloned = cloneConversation(existing);
    return normalizeDemoConversation(cloned, currentMemberId);
  }

  return {
    conversationId: null,
    peerMemberId,
    status: CONVERSATION_STATUS.NONE,
    initiatedByMemberId: null,
    messages: [],
  };
}

export function isCurrentUserInitiator(conversation, currentMemberId) {
  return conversation.initiatedByMemberId === currentMemberId;
}

export function canSendMessage(conversation, currentMemberId) {
  const { status } = conversation;

  if (status === CONVERSATION_STATUS.DECLINED) {
    return { allowed: false, reason: 'Cuộc trò chuyện đã bị từ chối.' };
  }

  if (status === CONVERSATION_STATUS.ACTIVE) {
    return { allowed: true };
  }

  if (status === CONVERSATION_STATUS.NONE) {
    return { allowed: true };
  }

  if (status === CONVERSATION_STATUS.PENDING) {
    if (!isCurrentUserInitiator(conversation, currentMemberId)) {
      return {
        allowed: false,
        reason: 'Chấp nhận lời mời để có thể trả lời.',
      };
    }

    const sent = countInitiatorMessages(conversation, currentMemberId);
    if (sent >= GREETING_MESSAGE_LIMIT) {
      return {
        allowed: false,
        reason: `Bạn đã gửi đủ ${GREETING_MESSAGE_LIMIT} lời chào. Vui lòng chờ phản hồi.`,
      };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: 'Không thể gửi tin nhắn.' };
}

export function sendMessage(peerMemberId, currentMemberId, body) {
  const trimmed = String(body ?? '').trim();
  if (!trimmed) {
    throw new Error('Nội dung tin nhắn không được để trống.');
  }

  const conversation = getConversation(peerMemberId, currentMemberId);
  const check = canSendMessage(conversation, currentMemberId);
  if (!check.allowed) {
    throw new Error(check.reason);
  }

  const now = new Date().toISOString();
  const newMessage = {
    id: nextMessageId++,
    senderMemberId: currentMemberId,
    body: trimmed,
    createdAt: now,
  };

  let updated = { ...conversation };

  if (
    updated.status === CONVERSATION_STATUS.NONE ||
    updated.status == null
  ) {
    updated = {
      ...updated,
      conversationId: updated.conversationId ?? nextConversationId++,
      status: CONVERSATION_STATUS.PENDING,
      initiatedByMemberId: currentMemberId,
    };
  }

  updated.messages = [...updated.messages, newMessage];
  updated.demoLocked = true;
  conversationMap.set(peerMemberId, updated);

  return cloneConversation(updated);
}

export function acceptConversation(peerMemberId, currentMemberId) {
  const conversation = getConversation(peerMemberId, currentMemberId);

  if (conversation.status !== CONVERSATION_STATUS.PENDING) {
    throw new Error('Không có lời mời đang chờ.');
  }

  if (isCurrentUserInitiator(conversation, currentMemberId)) {
    throw new Error('Bạn không thể chấp nhận lời mời do chính mình gửi.');
  }

  const updated = {
    ...conversation,
    status: CONVERSATION_STATUS.ACTIVE,
    demoLocked: true,
  };
  conversationMap.set(peerMemberId, updated);
  return cloneConversation(updated);
}

export function declineConversation(peerMemberId, currentMemberId) {
  const conversation = getConversation(peerMemberId, currentMemberId);

  if (conversation.status !== CONVERSATION_STATUS.PENDING) {
    throw new Error('Không có lời mời đang chờ.');
  }

  if (isCurrentUserInitiator(conversation, currentMemberId)) {
    throw new Error('Bạn không thể từ chối cuộc trò chuyện do chính mình bắt đầu.');
  }

  const updated = {
    ...conversation,
    status: CONVERSATION_STATUS.DECLINED,
    demoLocked: true,
  };
  conversationMap.set(peerMemberId, updated);
  return cloneConversation(updated);
}
