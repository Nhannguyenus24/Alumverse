import useAuthStore from '../../stores/authStore';

/**
 * ID user đăng nhập hiện tại (từ JWT/store). Trả về `null` nếu chưa đăng nhập.
 */
export function useNetworkCurrentMemberId() {
  const userId = useAuthStore((state) => state.user?.id);
  return userId != null ? Number(userId) : null;
}
