import useAuthStore from '../../stores/authStore';
import { MOCK_CURRENT_MEMBER_ID_FALLBACK } from '../../mocks/networkConversationConstants';
import { MOCK_SEED_CURRENT_MEMBER_ID } from '../../mocks/networkConversationMock';

/**
 * ID thành viên hiện tại cho mock chat.
 * Ưu tiên JWT `user.id`; demo seed dùng 100 — nếu user.id khác 100,
 * case 2–5 vẫn hoạt động vì logic so sánh initiator theo runtime id.
 */
export function useNetworkCurrentMemberId() {
  const userId = useAuthStore((state) => state.user?.id);
  if (userId != null) return Number(userId);
  return MOCK_SEED_CURRENT_MEMBER_ID ?? MOCK_CURRENT_MEMBER_ID_FALLBACK;
}
