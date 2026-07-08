import { useEffect, useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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

/**
 * Extract the most useful message from a failed request:
 * server-provided message → transport/network message → caller fallback.
 */
const getErrorMessage = (err, fallback) =>
  err?.response?.data?.message ?? err?.message ?? fallback;

/**
 * useAuth — single entry point for the client-side auth lifecycle.
 *
 * Lifecycle:
 * - Bootstraps the session from persisted storage on load, refreshing the access
 *   token when it is already expired (`authResolved` gates the route guards).
 * - Proactively refreshes the access token ~2 min before expiry, and again when
 *   the tab regains focus, so long-lived sessions stay valid without a 401 round-trip.
 * - Exposes the auth actions (login, register, OTP + password flows, logout), each
 *   returning a uniform `{ ok, error?, message?, data? }` result.
 *
 * The refresh token lives in an httpOnly cookie and is never touched here; the 401
 * interceptor and refresh de-duplication live in utils/axios.js.
 */
export const useAuth = () => {
  const { t } = useTranslation('auth');
  const queryClient = useQueryClient();
  const store = useAuthStore();

  const getFirstZodMessage = (error) =>
    error?.issues?.[0]?.message ?? t('invalid_data');
  const organizationIdFromStore = useOrganizationStore((state) => state.organization?.id ?? null);
  const { user, token, loading, error, verificationLevel, mustChangePassword } = store;

  const [storageHydrated, setStorageHydrated] = useState(() =>
    typeof useAuthStore.persist?.hasHydrated === 'function'
      ? useAuthStore.persist.hasHydrated()
      : true,
  );
  /** Session bootstrap (persist + optional refresh token) finished — used by guards only */
  const [authResolved, setAuthResolved] = useState(false);
  /** A proactive/visibility refresh is in flight — keeps guards authenticated while it resolves */
  const [refreshing, setRefreshing] = useState(false);

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
        const sessionData = await refreshSessionAccessToken();
        if (!cancelled) syncAuthStoreFromAccessToken(sessionData);
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

    let active = true;

    const maybeRefresh = () => {
      const t = useAuthStore.getState().token;
      if (!t) return;
      if (getSecondsUntilExpire(t) <= 120) {
        // Mark refreshing so isAuthenticated stays true while the token is
        // (about to be) expired but a refresh is in flight — avoids guards
        // bouncing the user to login during the async gap on tab-return.
        setRefreshing(true);
        refreshSessionAccessToken()
          .then((data) => {
            if (active) syncAuthStoreFromAccessToken(data);
          })
          .catch((err) => {
            // Nuốt lỗi mạng tạm thời, nhưng nếu là lỗi xác thực (401/403) thì reset store để user đăng xuất
            const status = err.response?.status;
            if (status === 401 || status === 403) {
              useAuthStore.getState().reset();
            }
          })
          .finally(() => {
            if (active) setRefreshing(false);
          });
      }
    };

    const intervalId = setInterval(maybeRefresh, 30_000);
    maybeRefresh();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') maybeRefresh();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      active = false;
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
    const mustChangePassword = responseData?.data?.mustChangePassword ?? false;
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
      mustChangePassword,
    });
    return { ok: true, data: { token: accessToken, user: authUser, verificationLevel, mustChangePassword } };
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
      return applyAccessTokenToStore(data, t('login_failed'));
    } catch (err) {
      const message = getErrorMessage(err, t('login_failed'));
      store.reset();
      store.setError(message);
      return { ok: false, error: message };
    }
  }, [store, organizationIdFromStore, setLoading, applyAccessTokenToStore]);

  const loginWithGoogle = useCallback(async (idToken, rememberMe = false) => {
    if (!idToken || typeof idToken !== 'string') {
      const msg = t('google_token_invalid');
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
      return applyAccessTokenToStore(data, t('google_login_failed'));
    } catch (err) {
      const message = getErrorMessage(err, t('google_login_failed'));
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
        const msg = data?.message ?? t('register_failed');
        store.reset();
        store.setError(msg);
        return { ok: false, error: msg };
      }
      store.setLoading(false);
      store.setError(null);
      return { ok: true };
    } catch (err) {
      const message = getErrorMessage(err, t('register_failed'));
      store.reset();
      store.setError(message);
      return { ok: false, error: message };
    }
  }, [store, organizationIdFromStore, setLoading]);

  /**
   * Runs a validated POST that does NOT establish a session (OTP-style flows):
   * validate → call → surface `{ ok, message }`. Never touches the token/user.
   */
  const runSimplePost = useCallback(async ({ schema, payload, url, failKey }) => {
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const msg = getFirstZodMessage(parsed.error);
      store.setError(msg);
      return { ok: false, error: msg };
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post(url, parsed.data);
      if (!data?.data) {
        const msg = data?.message ?? t(failKey);
        store.setError(msg);
        return { ok: false, error: msg };
      }
      store.setLoading(false);
      store.setError(null);
      return { ok: true, message: data?.message };
    } catch (err) {
      const message = getErrorMessage(err, t(failKey));
      store.setError(message);
      return { ok: false, error: message };
    }
  }, [store, setLoading, t]);

  /** Forgot-password: send an OTP to the given email. */
  const forgotPassword = useCallback(
    (payload) => runSimplePost({
      schema: sendOtpSchema,
      payload,
      url: '/auth/send-otp',
      failKey: 'send_otp_failed',
    }),
    [runSimplePost],
  );

  /** Verify the OTP sent during signup to activate the account. */
  const verifySignupCode = useCallback(
    (payload) => runSimplePost({
      schema: verifyOtpSchema,
      payload,
      url: '/auth/verify-otp',
      failKey: 'verify_otp_failed',
    }),
    [runSimplePost],
  );

  const resetPassword = useCallback(async (payload) => {
    const parsed = changePasswordSchema.safeParse(payload);
    if (!parsed.success) {
      const msg = getFirstZodMessage(parsed.error);
      store.setError(msg);
      return { ok: false, error: msg };
    }
    if (!store.user?.id) {
      const msg = t('login_required_for_change_password');
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
        const msg = data?.message ?? t('change_password_failed');
        store.setError(msg);
        return { ok: false, error: msg };
      }
      store.setLoading(false);
      store.setError(null);
      store.setMustChangePassword(false);
      return { ok: true, message: data?.message };
    } catch (err) {
      const message = getErrorMessage(err, t('change_password_failed'));
      store.setError(message);
      return { ok: false, error: message };
    }
  }, [store, setLoading]);

  const resetPasswordWithOtp = useCallback(async (payload) => {
    const { email, otp, newPassword } = payload ?? {};
    if (!email || !otp || !newPassword) {
      const msg = t('invalid_data');
      store.setError(msg);
      return { ok: false, error: msg };
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/reset-password', { email, otp, newPassword });
      if (!data?.data && data?.message == null) {
        const msg = t('change_password_failed');
        store.setError(msg);
        return { ok: false, error: msg };
      }
      store.setLoading(false);
      store.setError(null);
      return { ok: true, message: data?.message };
    } catch (err) {
      const message = getErrorMessage(err, t('change_password_failed'));
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
      // Check true expiry (skew 0) — the proactive refresh renews well before
      // this — and stay authenticated while a refresh is in flight.
      (!isTokenExpired(token, 0) || refreshing),
    /** Route guard: persist + bootstrap only — not API submit to avoid fullscreen flicker */
    isLoading: isBootLoading,
    /** Button/form busy: login, register, OTP, password flows */
    isSubmitting: loading,
    verificationLevel,
    mustChangePassword,
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
    resetPasswordWithOtp,
    logout,
  }), [
    storageHydrated, authResolved, refreshing, token, user, isBootLoading, loading, verificationLevel, mustChangePassword, error,
    setError, clearError, login, loginWithGoogle, register, forgotPassword, verifySignupCode, resetPassword, resetPasswordWithOtp, logout
  ]);
};
