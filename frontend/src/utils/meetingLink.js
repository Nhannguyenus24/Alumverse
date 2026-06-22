// ME-01: meeting-link validation helpers (mirrors backend MeetingLinkSupport).
// Only links from well-known conferencing providers are accepted for mentorship
// sessions, and we advise (non-blocking) against links that look password-gated.

/** Allowed base domains for meeting links. Keep in sync with the backend. */
export const ALLOWED_MEETING_DOMAINS = [
  'meet.google.com',
  'zoom.us',
  'zoom.com',
  'teams.microsoft.com',
  'teams.live.com',
  'teams.microsoft.us',
  'meet.jit.si',
  'whereby.com',
  'webex.com',
  'gotomeeting.com',
];

export const ALLOWED_MEETING_PLATFORMS_LABEL =
  'Google Meet, Zoom, Microsoft Teams, Jitsi Meet, Whereby, Webex, GoToMeeting';

const extractHost = (rawUrl) => {
  const value = (rawUrl ?? '').trim();
  if (!value) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(withScheme).hostname.toLowerCase();
  } catch {
    return null;
  }
};

/** @returns {boolean} true if the link points to a whitelisted provider. */
export const isAllowedMeetingLink = (rawUrl) => {
  const host = extractHost(rawUrl);
  if (!host) return false;
  return ALLOWED_MEETING_DOMAINS.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
};

/**
 * Blocking validation. Returns an error message, or null when valid.
 * @param {string} value
 * @param {{ optional?: boolean }} opts when optional, blank passes.
 */
export const validateMeetingLink = (value, { optional = true } = {}) => {
  const v = (value ?? '').trim();
  if (!v) return optional ? null : 'Vui lòng nhập link họp';
  if (!isAllowedMeetingLink(v)) {
    return `Link họp không hợp lệ. Chỉ chấp nhận link từ: ${ALLOWED_MEETING_PLATFORMS_LABEL}.`;
  }
  return null;
};

/**
 * Non-blocking advisory. Returns a warning when the link looks like it will
 * require a manually-entered password (preference is for passwordless links).
 * @returns {string|null}
 */
export const meetingLinkPasswordWarning = (value) => {
  const v = (value ?? '').trim();
  if (!v || !isAllowedMeetingLink(v)) return null;
  const host = extractHost(v);
  const lower = v.toLowerCase();
  // Zoom join links carry an embedded password via `pwd=`; without it the room
  // usually prompts for a password manually.
  if (host && host.endsWith('zoom.us') && lower.includes('/j/') && !lower.includes('pwd=')) {
    return 'Link Zoom này có thể yêu cầu nhập mật khẩu thủ công. Ưu tiên link không cần mật khẩu để mentee vào được ngay.';
  }
  return null;
};
