import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useNotificationUnreadStore from '../stores/notificationUnreadStore';

const SOUND_SRC = '/sounds/message-noti.mp3';
const FAVICON_SRC = '/alumverse_logo/Logo_Main.png';
const FLASH_INTERVAL_MS = 1000;

/**
 * A lightweight singleton that owns the browser-tab notification effects:
 *  - plays a short sound,
 *  - flashes the tab title between the page's base title and a notification
 *    title until the tab is refocused,
 *  - draws a red dot on the favicon whenever the unread count is non-zero.
 *
 * It's a module-level singleton (not per-component state) because the title and
 * favicon are global browser resources; multiple mounts must not fight.
 */
class _NotificationTabEffects {
  constructor() {
    this._flashTimer = null;
    this._baseTitle = document.title;
    this._flashTitle = null;
    this._showingFlash = false;
    this._audio = null;
    this._audioUnlocked = false;
    this._primeAudioOnInteraction();
    this._logoImg = null; // loaded favicon logo (null until loaded / on failure)
    this._originalFaviconHref = this._currentFaviconHref();
    this._dotShown = false; // driven by the bell unread count
    this._forceDot = false; // set by a realtime event (show dot immediately)
    // Hides the dot after the user refocuses the tab (they've "seen" it); a new
    // realtime event un-suppresses so a fresh notification shows the dot again.
    this._dotSuppressed = document.visibilityState === 'visible';
    this._visibilityBound = this._onVisibility.bind(this);
    document.addEventListener('visibilitychange', this._visibilityBound);
    this._loadLogo();
  }

  // Browsers block audio until the user has interacted with the page, and
  // throttle it harder for background (hidden) tabs. We "unlock" a single reused
  // Audio element on the first interaction so a later notification — even while
  // the tab is hidden — can play immediately instead of only when refocused.
  _primeAudioOnInteraction() {
    const unlock = () => {
      try {
        if (!this._audio) {
          this._audio = new Audio(SOUND_SRC);
          this._audio.volume = 0.5;
        }
        // Play muted then reset: satisfies the "user gesture" requirement so
        // subsequent .play() calls (from an SSE event) aren't blocked.
        this._audio.muted = true;
        this._audio
          .play()
          .then(() => {
            this._audio.pause();
            this._audio.currentTime = 0;
            this._audio.muted = false;
            this._audioUnlocked = true;
          })
          .catch(() => {});
      } catch {
        /* ignore */
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  playSound() {
    try {
      // Reuse the unlocked element so playback isn't blocked in a hidden tab.
      // (A fresh `new Audio()` each time re-triggers the autoplay gate.)
      if (!this._audio) {
        this._audio = new Audio(SOUND_SRC);
        this._audio.volume = 0.5;
      }
      this._audio.muted = false;
      this._audio.currentTime = 0;
      // Autoplay may still be blocked until the first interaction — swallow it.
      this._audio.play().catch(() => {});
    } catch {
      /* ignore */
    }
  }

  /** Start flashing the title with [title] until the tab is refocused. */
  startFlash(title) {
    if (document.visibilityState === 'visible') return; // don't flash a focused tab
    this._flashTitle = title;
    if (this._flashTimer) return;
    this._baseTitle = this._currentBaseTitle();
    this._showingFlash = false;
    this._flashTimer = setInterval(() => {
      this._showingFlash = !this._showingFlash;
      document.title = this._showingFlash ? this._flashTitle : this._baseTitle;
    }, FLASH_INTERVAL_MS);
  }

  stopFlash() {
    if (this._flashTimer) {
      clearInterval(this._flashTimer);
      this._flashTimer = null;
    }
    if (this._showingFlash) {
      document.title = this._baseTitle;
      this._showingFlash = false;
    }
  }

  // While flashing, document.title alternates; the "base" is whatever it was
  // when not showing the flash text.
  _currentBaseTitle() {
    if (this._flashTimer && this._showingFlash) return this._baseTitle;
    return document.title;
  }

  _onVisibility() {
    if (document.visibilityState === 'visible') {
      this.stopFlash();
      // Coming back to the tab clears the red-dot until the next realtime event.
      this._dotSuppressed = true;
      this._forceDot = false;
      this._applyDot();
    }
  }

  _currentFaviconHref() {
    const link = document.querySelector("link[rel~='icon']");
    return link ? link.getAttribute('href') : null;
  }

  // Load the logo once (same-origin, so NO crossOrigin — setting it would force
  // CORS mode and can make a same-origin asset fail to load). Re-apply the dot
  // state once loaded, since setDot() may have run before the image was ready.
  _loadLogo() {
    const img = new Image();
    img.onload = () => {
      this._logoImg = img;
      this._applyDot();
    };
    img.onerror = () => {
      this._logoImg = null; // fall back to a drawn blank badge
    };
    img.src = FAVICON_SRC;
  }

  setDot(show) {
    this._dotShown = show;
    this._applyDot();
  }

  /** Force the dot on immediately (a realtime notification just arrived). */
  showDot() {
    this._forceDot = true;
    this._dotSuppressed = false;
    this._applyDot();
  }

  _applyDot() {
    const want = (this._forceDot || this._dotShown) && !this._dotSuppressed;
    if (!want) {
      this._setFaviconHref(this._originalFaviconHref || FAVICON_SRC, 'image/svg+xml');
      return;
    }
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (this._logoImg) {
      ctx.drawImage(this._logoImg, 0, 0, size, size);
    }
    const r = size * 0.15;
    const cx = size - r - 1;
    const cy = r + 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#f5222d';
    ctx.fill();
    try {
      this._setFaviconHref(canvas.toDataURL('image/png'), 'image/png');
    } catch {
      /* canvas tainted — leave favicon as-is */
    }
  }

  _setFaviconHref(href, type) {
    if (!href) return;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    if (type) link.type = type;
    link.href = href;
  }
}

let _singleton = null;
function _effects() {
  if (!_singleton) _singleton = new _NotificationTabEffects();
  return _singleton;
}

/**
 * Returns `notify()` — call it when a realtime notification arrives to play the
 * sound and start the tab-title flash. Also keeps the favicon red-dot in sync
 * with the notification-bell unread count for as long as this hook is mounted.
 */
export const useNotificationEffects = () => {
  const { t } = useTranslation('notification');
  const count = useNotificationUnreadStore((s) => s.count);

  // Favicon dot follows the bell count.
  useEffect(() => {
    _effects().setDot(count > 0);
  }, [count]);

  return useCallback(
    (title) => {
      const fx = _effects();
      fx.playSound();
      fx.startFlash(title || t('tab_flash', 'Bạn có thông báo mới'));
      fx.showDot(); // a realtime notification arrived → red-dot immediately
    },
    [t],
  );
};
