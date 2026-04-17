import apiClient from '../utils/axios';
import { userFromAccessToken, isTokenExpired } from '../utils/jwt';
import {
  loginSchema,
  registerSchema,
  sendOtpSchema,
  verifyOtpSchema,
  changePasswordSchema,
} from '../schemas/authSchemas';
import useAuthStore from '../stores/authStore';

function getFirstZodMessage(error) {
  return error?.issues?.[0]?.message ?? 'Dữ liệu không hợp lệ';
}

export const useAuth = () => {
  const store = useAuthStore();
  const { user, token, loading, error } = store;

  const setLoading = (value) => {
    store.setLoading(value);
    if (value) store.setError(null);
  };
  const setError = (message) => store.setError(message);
  const clearError = () => store.setError(null);

  const applyAccessTokenToStore = (responseData, fallbackMessage) => {
    const accessToken = responseData?.data?.accessToken ?? null;
    const authUser = userFromAccessToken(accessToken);
    if (!accessToken || !authUser) {
      const msg = responseData?.message ?? fallbackMessage;
      store.setError(msg);
      store.reset();
      return { ok: false, error: msg };
    }
    store.setUser(authUser);
    store.setToken(accessToken);
    store.setLoading(false);
    store.setError(null);
    return { ok: true, data: { token: accessToken, user: authUser } };
  };

  const login = async (payload) => {
    const parsed = loginSchema.safeParse(payload);
    if (!parsed.success) {
      const msg = getFirstZodMessage(parsed.error);
      store.setError(msg);
      return { ok: false, error: msg };
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/login', parsed.data);
      return applyAccessTokenToStore(data, 'Đăng nhập thất bại');
    } catch (err) {
      const message = err.response?.data?.message ?? err.message ?? 'Đăng nhập thất bại';
      store.reset();
      store.setError(message);
      return { ok: false, error: message };
    }
  };

  const loginWithGoogle = async (idToken) => {
    if (!idToken || typeof idToken !== 'string') {
      const msg = 'Google ID token không hợp lệ';
      store.setError(msg);
      return { ok: false, error: msg };
    }

    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/google-login', { idToken });
      return applyAccessTokenToStore(data, 'Đăng nhập Google thất bại');
    } catch (err) {
      const message = err.response?.data?.message ?? err.message ?? 'Đăng nhập Google thất bại';
      store.reset();
      store.setError(message);
      return { ok: false, error: message };
    }
  };

  const register = async (payload) => {
    const parsed = registerSchema.safeParse(payload);
    if (!parsed.success) {
      const msg = getFirstZodMessage(parsed.error);
      store.setError(msg);
      return { ok: false, error: msg };
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/register', {
        email: parsed.data.email,
        userName: parsed.data.studentId,
        fullName: parsed.data.fullName,
        password: parsed.data.password,
      });
      if (!data?.data) {
        const msg = data?.message ?? 'Đăng ký thất bại';
        store.setError(msg);
        store.reset();
        return { ok: false, error: msg };
      }
      store.setLoading(false);
      store.setError(null);
      return { ok: true };
    } catch (err) {
      const message = err.response?.data?.message ?? err.message ?? 'Đăng ký thất bại';
      store.reset();
      store.setError(message);
      return { ok: false, error: message };
    }
  };

  const forgotPassword = async (payload) => {
    const parsed = sendOtpSchema.safeParse(payload);
    if (!parsed.success) {
      const msg = getFirstZodMessage(parsed.error);
      store.setError(msg);
      return { ok: false, error: msg };
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/send-otp', parsed.data);
      store.setLoading(false);
      if (!data?.data) {
        const msg = data?.message ?? 'Gửi mã thất bại';
        store.setError(msg);
        return { ok: false, error: msg };
      }
      store.setError(null);
      return { ok: true, message: data?.message };
    } catch (err) {
      const message = err.response?.data?.message ?? err.message ?? 'Gửi mã thất bại';
      store.setLoading(false);
      store.setError(message);
      return { ok: false, error: message };
    }
  };

  const verifySignupCode = async (payload) => {
    const parsed = verifyOtpSchema.safeParse(payload);
    if (!parsed.success) {
      const msg = getFirstZodMessage(parsed.error);
      store.setError(msg);
      return { ok: false, error: msg };
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/verify-otp', parsed.data);
      store.setLoading(false);
      if (!data?.data) {
        const msg = data?.message ?? 'Xác thực mã thất bại';
        store.setError(msg);
        return { ok: false, error: msg };
      }
      store.setError(null);
      return { ok: true, message: data?.message };
    } catch (err) {
      const message = err.response?.data?.message ?? err.message ?? 'Xác thực mã thất bại';
      store.setLoading(false);
      store.setError(message);
      return { ok: false, error: message };
    }
  };

  const resetPassword = async (payload) => {
    const parsed = changePasswordSchema.safeParse(payload);
    if (!parsed.success) {
      const msg = getFirstZodMessage(parsed.error);
      store.setError(msg);
      return { ok: false, error: msg };
    }
    if (!store.user?.id) {
      const msg = 'Vui lòng đăng nhập để đổi mật khẩu';
      store.setError(msg);
      return { ok: false, error: msg };
    }
    setLoading(true);
    try {
      const { data } = await apiClient.put(`/auth/password/${store.user.id}`, {
        oldPassword: parsed.data.oldPassword,
        newPassword: parsed.data.newPassword,
      });
      store.setLoading(false);
      if (!data?.data) {
        const msg = data?.message ?? 'Đổi mật khẩu thất bại';
        store.setError(msg);
        return { ok: false, error: msg };
      }
      store.setError(null);
      return { ok: true, message: data?.message };
    } catch (err) {
      const message = err.response?.data?.message ?? err.message ?? 'Đổi mật khẩu thất bại';
      store.setLoading(false);
      store.setError(message);
      return { ok: false, error: message };
    }
  };

  const logout = async () => {
    store.setLoading(true);
    store.setError(null);
    try {
      await apiClient.post('/auth/logout');
    } finally {
      store.reset();
    }
  };

  return {
    isAuthenticated: !!token && !isTokenExpired(token),
    isLoading: loading,
    user,
    error,
    setError,
    clearError,
    login,
    loginWithGoogle,
    register,
    forgotPassword,
    verifySignupCode,
    resetPassword,
    logout,
  };
};
