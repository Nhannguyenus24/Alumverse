/** Trạng thái hội thoại 1:1 — map sang API sau */
export const CONVERSATION_STATUS = {
  NONE: 'NONE',
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  DECLINED: 'DECLINED',
};

export const GREETING_MESSAGE_LIMIT = 1;

/** Fallback khi chưa đăng nhập (chỉ dev/mock) */
export const MOCK_CURRENT_MEMBER_ID_FALLBACK = 100;
