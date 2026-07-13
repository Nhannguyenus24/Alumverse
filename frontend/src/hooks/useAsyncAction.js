import { useCallback, useRef, useState } from "react";
import i18next from "i18next";
import { useNotification } from "./useNotification";

/**
 * Wraps an async admin action with: a `pending` flag (for disabling triggers /
 * showing an overlay), a re-entrancy lock (drops calls fired while one is still
 * running, so spam-clicks can't produce duplicate requests), and success/error
 * snackbars.
 *
 * Usage:
 *   const { run, pending } = useAsyncAction();
 *   await run(() => api.approveMentor(id), {
 *     successMessage: t('...'),
 *     errorMessage: t('...'),   // fallback; backend message wins if present
 *     onSuccess: () => reload(),
 *   });
 *
 * `run` resolves to the action's return value on success, or `undefined` if it
 * failed or was dropped by the lock.
 */
export const useAsyncAction = () => {
  const { showSuccess, showError } = useNotification();
  const [pending, setPending] = useState(false);
  const running = useRef(false);

  const run = useCallback(
    async (action, options = {}) => {
      const { successMessage, errorMessage, onSuccess, onError } = options;
      if (running.current) return undefined; // drop spam-click / concurrent call
      running.current = true;
      setPending(true);
      try {
        const result = await action();
        if (successMessage) showSuccess(successMessage);
        if (onSuccess) await onSuccess(result);
        return result;
      } catch (error) {
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          errorMessage ||
          i18next.t("common:error");
        showError(msg);
        if (onError) onError(error);
        return undefined;
      } finally {
        running.current = false;
        setPending(false);
      }
    },
    [showSuccess, showError],
  );

  return { run, pending };
};
