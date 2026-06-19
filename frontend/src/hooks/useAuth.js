import { useEffect, useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient, { refreshSessionAccessToken, syncAuthStoreFromAccessToken } from '../utils/axios';
import { userFromAccessToken, isTokenExpired, getSecondsUntilExpire } from '../utils/jwt';
import {
  loginSchema,
  registerSchema,
  sendOtpSchema,
  verifyOtpSchema,
  changePasswordSchema,
} from '../utils/regexUtils';
import useAuthStore from '../stores/authStore';
import useOrganizationStore from '../stores/organizationStore';

function getFirstZodMessage(error) {
  return error?.issues?.[0]?.message ?? 'Dữ liệu không hợp lệ';
}

export const useAuth = () => {
  const queryClient = useQueryClient();
  const store = useAuthStore();
  const organizationIdFromStore = useOrganizationStore((state) => state.organization?.id ?? null);
  const { user, token, loading, error, verificationLevel } = store;

  const [storageHydrated, setStorageHydrated] = useState(() =>
    typeof useAuthStore.persist?.hasHydrated === 'function'
      ? useAuthStore.persist.hasHydrated()
      : true,
  );
  /** Session bootstrap (persist + optional refresh token) finished — used by guards only */
  const [authResolved, setAuthResolved] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist?.onFinishHydration?.(() => {
      setStorageHydrated(true);
    });
    if (typeof useAuthStore.persist?.hasHydrated === 'function' && useAuthStore.persist.hasHydrated()) {
      setStorageHydrated(true);
    }
    return () => {
      unsub?.();
    };
  }, []);

  useEffect(() => {
    if (!storageHydrated) {
      return undefined;
    }

    let cancelled = false;
    const { token: t, user: u } = useAuthStore.getState();
    if (!t || !u) {
      setAuthResolved(true);
      return undefined;
    }
    if (!isTokenExpired(t)) {
      setAuthResolved(true);
      return undefined;
    }

    (async () => {
      try {
        const newToken = await refreshSessionAccessToken();
        if (!cancelled) syncAuthStoreFromAccessToken(newToken);
      } catch {
        if (!cancelled) {
          useAuthStore.getState().reset();
        }
      } finally {
        if (!cancelled) setAuthResolved(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storageHydrated]);

  useEffect(() => {
    if (!storageHydrated || !token || !user || !authResolved) return undefined;

    const maybeRefresh = () => {
      const t = useAuthStore.getState().token;
      if (!t) return;
      if (getSecondsUntilExpire(t) <= 120) {
        refreshSessionAccessToken()
          .then((newToken) => syncAuthStoreFromAccessToken(newToken))
          .catch(() => {});
      }
    };

    const intervalId = setInterval(maybeRefresh, 30_000);
    maybeRefresh();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') maybeRefresh();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [storageHydrated, token, user, authResolved]);

  const setLoading = useCallback((value) => store.setLoading(value), [store]);
  const setError = useCallback((message) => store.setError(message), [store]);
  const clearError = useCallback(() => store.setError(null), [store]);

  const applyAccessTokenToStore = useCallback((responseData, fallbackMessage) => {
    const accessToken = responseData?.data?.accessToken ?? null;
    const verificationLevel = responseData?.data?.verificationLevel ?? null;
    const authUser = userFromAccessToken(accessToken);
    if (!accessToken || !authUser) {
      const msg = responseData?.message ?? fallbackMessage;
      store.reset();
      store.setError(msg);
      return { ok: false, error: msg };
    }
    store.setAuth({
      user: authUser,
      token: accessToken,
      verificationLevel,
    });
    return { ok: true, data: { token: accessToken, user: authUser, verificationLevel } };
  }, [store]);

  const login = useCallback(async (payload) => {
    const parsed = loginSchema.safeParse(payload);
    if (!parsed.success) {
      const msg = getFirstZodMessage(parsed.error);
      store.setError(msg);
      return { ok: false, error: msg };
    }
    const organizationId = payload.organizationId ?? organizationIdFromStore;
    const rememberMe = payload.rememberMe ?? false;
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/login', {
        ...parsed.data,
        organizationId,
        rememberMe,
      });
      return applyAccessTokenToStore(data, 'Đăng nhập thất bại');
    } catch (err) {
      const message = err.response?.data?.message ?? err.message ?? 'Đăng nhập thất bại';
      store.reset();
      store.setError(message);
      return { ok: false, error: message };
    }
  }, [store, organizationIdFromStore, setLoading, applyAccessTokenToStore]);

  const loginWithGoogle = useCallback(async (idToken, rememberMe = false) => {
    if (!idToken || typeof idToken !== 'string') {
      const msg = 'Google ID token không hợp lệ';
      store.setError(msg);
      return { ok: false, error: msg };
    }

    if (!organizationIdFromStore) {
      const msg = 'Organization ID is required';
      store.setError(msg);
      return { ok: false, error: msg };
    }

    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/google-login', {
        idToken,
        organizationId: organizationIdFromStore,
        rememberMe,
      });
      return applyAccessTokenToStore(data, 'Đăng nhập Google thất bại');
    } catch (err) {
      const message = err.response?.data?.message ?? err.message ?? 'Đăng nhập Google thất bại';
      store.reset();
      store.setError(message);
      return { ok: false, error: message };
    }
  }, [store, organizationIdFromStore, setLoading, applyAccessTokenToStore]);

  const register = useCallback(async (payload) => {
    const parsed = registerSchema.safeParse(payload);
    if (!parsed.success) {
      const msg = getFirstZodMessage(parsed.error);
      store.setError(msg);
      return { ok: false, error: msg };
    }
    const organizationId = payload.organizationId ?? organizationIdFromStore;
    if (!organizationId) {
      const msg = 'Organization ID is required';
      store.setError(msg);
      return { ok: false, error: msg };
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/register', {
        email: parsed.data.email,
        studentId: parsed.data.studentId,
        fullName: parsed.data.fullName,
        password: parsed.data.password,
        organizationId,
      });
      if (!data?.data) {
        const msg = data?.message ?? 'Đăng ký thất bại';
        store.reset();
        store.setError(msg);
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
  }, [store, organizationIdFromStore, setLoading]);

  const forgotPassword = useCallback(async (payload) => {
    const parsed = sendOtpSchema.safeParse(payload);
    if (!parsed.success) {
      const msg = getFirstZodMessage(parsed.error);
      store.setError(msg);
      return { ok: false, error: msg };
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/send-otp', parsed.data);
      if (!data?.data) {
        const msg = data?.message ?? 'Gửi mã thất bại';
        store.setError(msg);
        return { ok: false, error: msg };
      }
      store.setLoading(false);
      store.setError(null);
      return { ok: true, message: data?.message };
    } catch (err) {
      const message = err.response?.data?.message ?? err.message ?? 'Gửi mã thất bại';
      store.setError(message);
      return { ok: false, error: message };
    }
  }, [store, setLoading]);

  const verifySignupCode = useCallback(async (payload) => {
    const parsed = verifyOtpSchema.safeParse(payload);
    if (!parsed.success) {
      const msg = getFirstZodMessage(parsed.error);
      store.setError(msg);
      return { ok: false, error: msg };
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/verify-otp', parsed.data);
      if (!data?.data) {
        const msg = data?.message ?? 'Xác thực mã thất bại';
        store.setError(msg);
        return { ok: false, error: msg };
      }
      store.setLoading(false);
      store.setError(null);
      return { ok: true, message: data?.message };
    } catch (err) {
      const message = err.response?.data?.message ?? err.message ?? 'Xác thực mã thất bại';
      store.setError(message);
      return { ok: false, error: message };
    }
  }, [store, setLoading]);

  const resetPassword = useCallback(async (payload) => {
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
      if (!data?.data) {
        const msg = data?.message ?? 'Đổi mật khẩu thất bại';
        store.setError(msg);
        return { ok: false, error: msg };
      }
      store.setLoading(false);
      store.setError(null);
      return { ok: true, message: data?.message };
    } catch (err) {
      const message = err.response?.data?.message ?? err.message ?? 'Đổi mật khẩu thất bại';
      store.setError(message);
      return { ok: false, error: message };
    }
  }, [store, setLoading]);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      queryClient.clear();
      store.reset();
    }
  }, [queryClient, store]);

  const isBootLoading = !storageHydrated || !authResolved;

  return useMemo(() => ({
    isAuthenticated:
      storageHydrated &&
      authResolved &&
      !!token &&
      !!user &&
      !isTokenExpired(token),
    /** Route guard: persist + bootstrap only — not API submit to avoid fullscreen flicker */
    isLoading: isBootLoading,
    /** Button/form busy: login, register, OTP, password flows */
    isSubmitting: loading,
    verificationLevel,
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
  }), [
    storageHydrated, authResolved, token, user, isBootLoading, loading, verificationLevel, error,
    setError, clearError, login, loginWithGoogle, register, forgotPassword, verifySignupCode, resetPassword, logout
  ]);
};
