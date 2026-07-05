# Plan: Move Chat Verification Gate from Input Box to Route Level

> **Scope: frontend only.** This plan does not add, change, or plan any backend/server-side enforcement of verification level on the chat send path. It only relocates where the *existing* frontend-only gate is rendered (from an inline disabled `TextField` to a route-level blocked screen). See "Related gap" at the end for the (separate, out-of-scope) backend hole this does not close.

> **Status:** All sections (1–6) are **implemented**.

## Problem

Today, a member with `verificationLevel < 2` (e.g. level 1 — "Đã yêu cầu" / requested-but-not-approved) can open `/:slug/chat`, see the sidebar and full message history, but the "Nhập tin nhắn" input and Send button are silently `disabled` with a tooltip attached to them. This is implemented per-control inside `NetworkChatPanel.jsx`:

- `frontend/src/components/network/NetworkChatPanel.jsx:209` — `isInputDisabled = !isOpen || isMessagingBlocked || !canContribute`
- `frontend/src/components/network/NetworkChatPanel.jsx:213` — same condition duplicated in `handleSend`
- `frontend/src/components/network/NetworkChatPanel.jsx:630-641` — inline `Tooltip` with a ternary that special-cases `!canContribute` alongside the unrelated block/unblock states
- `frontend/src/components/network/NetworkChatPanel.jsx:658,676,687` — `disabled={isInputDisabled}` on the `TextField`, emoji button, and Send `IconButton`

This works, but it's "magic" tucked deep in a chat-panel component that's otherwise about messaging mechanics, not access control — easy to miss, easy to duplicate incorrectly, and it lets the user land on the full chat UI only to discover mid-page that they can't use it.

## Goal

Gate access **at the route**, the same way `MentorshipFullAccessGate` / `MentorshipBookingGate` already gate mentorship routes (`frontend/src/routes/index.jsx:625-648`). When a member's verification level is below the required threshold, they should see a single, clear blocked-state screen (heading + explanation, with a tooltip for detail) instead of the chat UI — not a fully rendered chat with one silently-disabled control.

Once the route is gated, `NetworkChatPanel` no longer needs to know about verification at all for the send path — it only renders once access is already confirmed.

The same gap exists at the two other places a user can jump into chat without going through the `/chat` route link directly: the messages icon in the header (`MessagesNavDropdown`) and the floating chat button (`ChatFloatingButton`). Both currently open a live conversation-preview panel — with real message previews — for any authenticated user regardless of verification level, and only fail once the user clicks through to `/chat`. Section 5–6 extend the same gate to those two entry points.

## Non-goals

- Not touching the **block/unblock** feature (`blockedByMe` / `blockedByPeer`, `isMessagingBlocked`) — that stays exactly as is, including its own tooltip/placeholder text.
- Not touching `canContribute` usage elsewhere in `NetworkChatPanel.jsx` for the **block-user action** (lines 343, 346, 357, 360, 399, 400, 724) — blocking another member is a separate contribute-gated action from sending messages and is out of scope here.
- Not changing the `useCanContribute` threshold (`MIN_CONTRIBUTE_VERIFICATION_LEVEL = 2`) or its use on other pages (forum, mentorship, network requests, group-chat creation dialog).
- Backend enforcement of verification level on the chat send path is a separate, currently-missing safeguard (see "Related gap" at the end) — not part of this change unless you want to fold it in.

## Design

### 1. New component: `ChatAccessGate`

`frontend/src/components/network/ChatAccessGate.jsx` (sibling to `NetworkChatPanel.jsx`, `NetworkChatSidebar.jsx`), modeled on `MentorshipFullAccessGate.jsx` but rendering an **in-place blocked screen** instead of redirecting (chat has no separate "landing page" to redirect to — mentorship does).

```jsx
import { CircularProgress, Box, Container, Typography, Alert, Tooltip, IconButton } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useTranslation } from 'react-i18next';
import { useCanContribute } from '../../hooks/useCanContribute';
import { useMyOrganizationMember } from '../../hooks/useMyOrganizationMember';
import Page from '../Page';

const ChatAccessGate = ({ children }) => {
  const { t } = useTranslation(['network', 'common']);
  const { isAuthenticated, isPrivileged, verificationLevel } = useCanContribute();
  const orgMemberQuery = useMyOrganizationMember();

  // authStore's verificationLevel only refreshes at login/token-refresh, so it
  // goes stale right after an admin approves verification (same caveat as
  // useMentorshipAccessState.js:29-32). Take the higher of the two so a
  // newly-approved member doesn't have to log out/in to unlock chat.
  const liveLevel = Number(orgMemberQuery.data?.verificationLevel ?? 0);
  const level = Math.max(verificationLevel ?? 0, liveLevel);
  const isLoading = orgMemberQuery.isLoading;
  const canAccessChat = isPrivileged || level >= 2;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (canAccessChat) return children;

  return (
    <Page title="Chat">
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          {t('network:chat.access_blocked_title')}
        </Typography>
        <Alert severity="warning" sx={{ textAlign: 'left', mt: 2 }}>
          {isAuthenticated
            ? t('common:verification_required_alert')
            : t('common:verification_required_login')}
          <Tooltip title={t('common:verification_required_tooltip')} arrow>
            <IconButton size="small" sx={{ ml: 1 }} aria-label={t('common:verification_required_tooltip')}>
              <InfoOutlinedIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Alert>
      </Container>
    </Page>
  );
};

export default ChatAccessGate;
```

Notes on this sketch (adjust freely during implementation, this is the shape, not the final copy):
- Reuses the **existing** `common:verification_required_alert` / `verification_required_tooltip` / `verification_required_login` i18n keys already used by `ContributeGuard.jsx` — no new backend/i18n concepts, just a new place they're rendered.
- The `IconButton` + `Tooltip` combo gives you the "tooltip for this" you asked for, attached to a static info affordance rather than to a disabled form control.
- `ProtectedRoute` already guarantees `isAuthenticated` before this gate runs (see routing below), so the `isAuthenticated` branch is mostly defensive/unreachable — kept for parity with `ContributeGuard`'s existing pattern.

### 2. Wire it into the route

`frontend/src/routes/index.jsx:433-441`, add one import and one wrapper level, following the exact nesting style already used for mentorship gates (`index.jsx:11-12`, `620-648`):

```jsx
// near the other gate imports (index.jsx:11-12)
import ChatAccessGate from "../components/network/ChatAccessGate";
```

```jsx
{
  path: "chat",
  handle: { hideFooter: true },
  element: (
    <ProtectedRoute>
      <ChatAccessGate>
        <ChatPage />
      </ChatAccessGate>
    </ProtectedRoute>
  ),
},
```

This blocks the **entire route** — sidebar, message history, everything — for level < 2, matching "block at route level" rather than letting them see the conversation and only failing at the input.

> Open question for you: right now a level-1 user can currently still *read* existing conversations (only sending was disabled). Blocking the whole route means they lose read access too. Confirm that's the intended behavior change — if you'd rather keep read-only access and only gate *sending*, say so and we'll scope `ChatAccessGate` to wrap just the composer area inside `ChatPage`/`NetworkChatPanel` instead of the whole route. Given your message ("block at route level... remove the block at chat button"), I'm assuming full-route blocking is what you want.

### 3. Strip the verification check out of `NetworkChatPanel.jsx`

Once the route can't be reached without `canContribute`-equivalent access, remove the send-path gating (keep `canContribute`/`isAuthenticated` import and its other, unrelated uses for the block/unblock feature — see Non-goals):

- `frontend/src/components/network/NetworkChatPanel.jsx:209`
  ```diff
  - const isInputDisabled = !isOpen || isMessagingBlocked || !canContribute;
  + const isInputDisabled = !isOpen || isMessagingBlocked;
  ```
- `frontend/src/components/network/NetworkChatPanel.jsx:211-216`
  ```diff
  - if (!text || !activeChat?.id || !isOpen || isMessagingBlocked || !canContribute) return;
  + if (!text || !activeChat?.id || !isOpen || isMessagingBlocked) return;
  ```
  and drop `canContribute` from that `useCallback`'s dependency array.
- `frontend/src/components/network/NetworkChatPanel.jsx:630-641` — simplify the tooltip to only cover the block states (the whole `Tooltip` wrapper can likely be dropped in favor of just the placeholder text change, since there's no longer a "why is this disabled" case left to explain here):
  ```diff
  - <Tooltip
  -   title={
  -     blockedByMe
  -       ? t('network:blocked_placeholder')
  -       : blockedByPeer
  -         ? t('network:cannot_message_placeholder')
  -         : !canContribute
  -           ? (isAuthenticated ? t('common:verification_required_tooltip') : t('common:verification_required_login'))
  -           : ''
  -   }
  -   placement="top"
  -   disableHoverListener={!isMessagingBlocked && canContribute}
  - >
  -   <TextField ... />
  - </Tooltip>
  + <Tooltip
  +   title={
  +     blockedByMe
  +       ? t('network:blocked_placeholder')
  +       : blockedByPeer
  +         ? t('network:cannot_message_placeholder')
  +         : ''
  +   }
  +   placement="top"
  +   disableHoverListener={!isMessagingBlocked}
  + >
  +   <TextField ... />
  + </Tooltip>
  ```
- Placeholder text at `NetworkChatPanel.jsx:648-654` already falls through to `message_input_placeholder` once `isMessagingBlocked` is false — no change needed there.

### 4. i18n

Add one new key (used by `ChatAccessGate`'s heading — the rest reuse existing `common:*` keys):

- `frontend/src/i18n/locales/vi/network.json` → `"chat": { ..., "access_blocked_title": "Cần xác minh cựu sinh viên để trò chuyện" }`
- `frontend/src/i18n/locales/en/network.json` → `"chat": { ..., "access_blocked_title": "Alumni verification required to chat" }`

(Check the existing `network.json` structure — `blocked_placeholder` etc. at `network.json:166-169` are top-level keys, not nested under `chat`, despite other chat-prefixed keys like `chat.file_type_unsupported` existing elsewhere in the file — match whichever nesting the file actually uses when implementing.)

### 5. Extract a shared `useCanAccessChat` hook

`ChatAccessGate` currently computes "may this user use chat" inline (`useCanContribute` + `useMyOrganizationMember`, taking the higher of the store/live verification level). The header icon and floating button need the exact same check, so pull it out once instead of copy-pasting the staleness fix three times:

`frontend/src/hooks/chat/useCanAccessChat.js` (new):

```jsx
import { useCanContribute } from '../useCanContribute';
import { useMyOrganizationMember } from '../useMyOrganizationMember';

/**
 * Whether the current user may access chat at all (open conversations,
 * see previews, send messages) — verificationLevel >= 2, ADMIN/STAFF bypass.
 * Takes the higher of the (possibly stale) authStore level and the live
 * OrganizationMember record, same as useMentorshipAccessState.
 */
export const useCanAccessChat = () => {
  const { isAuthenticated, isPrivileged, verificationLevel } = useCanContribute();
  const orgMemberQuery = useMyOrganizationMember();
  const liveLevel = Number(orgMemberQuery.data?.verificationLevel ?? 0);
  const level = Math.max(verificationLevel ?? 0, liveLevel);

  return {
    canAccessChat: isPrivileged || level >= 2,
    isAuthenticated,
    isLoading: orgMemberQuery.isLoading,
  };
};
```

`ChatAccessGate.jsx` then simplifies to call this hook instead of duplicating the two hooks + `Math.max` itself.

### 6. Guard the header messages icon and the floating chat button

Both entry points render the same shared panel — `MessagesNavDropdown.jsx` (header, `Header.jsx:395`) and `ChatFloatingButton.jsx` (via `FloatingChatActions.jsx`) each open a MUI `Menu` containing `MessagesPreviewPanel`, which lists real conversation previews and links to `/chat`. Neither currently checks verification level, so an unverified member can already read message previews from these two widgets before ever hitting the route gate.

Follow the same **lock-the-trigger** convention `Header.jsx` already uses for other `requiresAuth` nav items (`Header.jsx:250-266`, `573-641` — disabled button + lock icon + tooltip) rather than opening the panel and showing a blocked message inside it:

- **`frontend/src/components/MessagesNavDropdown.jsx`**: call `useCanAccessChat()`. When `!canAccessChat` (and the user is authenticated — guests already can't reach this icon, it's only rendered inside `{isAuthenticated ? ... }` in `Header.jsx:392-400`), disable the `IconButton` (`disabled` prop, and skip calling `setAnchorEl` in `handleOpen`) and swap the `Tooltip` title from `t('conversations')` to `t('common:verification_required_tooltip')`.
- **`frontend/src/components/ChatFloatingButton.jsx`**: call `useCanAccessChat()`. When authenticated but `!canAccessChat`, make `handleClick` a no-op (don't open the menu) and swap the `Tooltip` title (currently always `t('chat_tooltip')`, line 125) to the verification message when blocked.
- Because the click never opens the `Menu`, `MessagesPreviewPanel.jsx` itself does **not** need to change — it's unreachable for a blocked user through either entry point. (If a future entry point renders `MessagesPreviewPanel` without going through one of these two triggers, gate it there directly using the same hook.)

### Warning color: match the app's theme, not MUI's default

Every "you need to verify" surface must render in the app's actual **branded** warning color, not MUI's stock warning orange. This is already handled automatically as long as components use MUI's `severity`/`color` props instead of a hardcoded hex:

- The app overrides `MuiAlert`'s `standardWarning` style slot in `frontend/src/theme/overrides/Alert.jsx:26` to use `theme.palette.warning.main`/`.dark`, which resolves to the custom brand color `#DFBA00` (`frontend/src/theme/palette.jsx:47-53`), not MUI's default `#ED6C02`. So `<Alert severity="warning">` in `ChatAccessGate` (section 1) already renders in the correct system color automatically — no extra work needed there, just don't override its color via `sx`.
- For the lock icon / tooltip treatment on the header icon and floating button (section 6), use theme tokens the same way the existing guest-verification banner in `Header.jsx:439-533` already does — `color="warning.dark"` / `alpha(theme.palette.warning.main, 0.12)` for any icon tint or background, and MUI's `Iconify icon="eva:lock-fill"` (already used for the other locked nav items at `Header.jsx:262`) for the lock glyph, rather than introducing a new icon or a new ad-hoc color.

## Files touched

| File | Change | Status |
|---|---|---|
| `frontend/src/components/network/ChatAccessGate.jsx` | **New.** Route-level gate + blocked screen (now built on `useCanAccessChat`). | Done |
| `frontend/src/routes/index.jsx` | Import `ChatAccessGate`; wrap `<ChatPage />` with it inside the existing `<ProtectedRoute>` for `path: "chat"`. | Done |
| `frontend/src/components/network/NetworkChatPanel.jsx` | Remove `!canContribute` from `isInputDisabled`, `handleSend`, and the composer `Tooltip`. Leave all other `canContribute` usages (block/unblock UI) untouched. | Done |
| `frontend/src/i18n/locales/{vi,en}/network.json` | Add `access_blocked_title` key. | Done |
| `frontend/src/hooks/chat/useCanAccessChat.js` | **New.** Shared access hook (section 5). | Done |
| `frontend/src/components/MessagesNavDropdown.jsx` | Disable icon + swap tooltip when blocked (section 6). | Done |
| `frontend/src/components/ChatFloatingButton.jsx` | No-op click + swap tooltip + dim avatar when blocked (section 6). | Done |

## Manual test plan

1. As a level-1 member (`bui.van.h@hcmus.edu.vn` per your report), go to `/cs-hcmus/chat` → should see the blocked screen immediately, not the chat UI.
2. As a level-2/verified member or ADMIN/STAFF, go to `/cs-hcmus/chat` → normal chat UI, input enabled, no `canContribute`-related tooltip.
3. As a level-2 member, block/unblock a peer → block-related disabling/placeholders on the composer still work exactly as before (unchanged code path).
4. Approve a level-1 member to level 2 via admin, without logging them out → confirm they can now access `/chat` without a fresh login (validates the `Math.max(store, live)` staleness handling).
5. As a guest/unauthenticated user hitting `/cs-hcmus/chat` directly → confirm `ProtectedRoute` still redirects to login before `ChatAccessGate` ever renders (no regression there).
6. As a level-1 member, hover/click the messages icon in the header → icon shows disabled state, tooltip explains verification is required, no preview panel opens.
7. As a level-1 member, hover/click the floating chat button → same as above (disabled, tooltip, no panel).
8. As a level-2/verified member, both the header icon and floating button open the preview panel normally and link through to `/chat`.
9. Visually compare the blocked screen's `Alert` (section 1) and the header's existing guest-verification banner (`Header.jsx:439-533`) side by side — both should render the same warning yellow (`#DFBA00` family), confirming no ad-hoc color crept in.

## Related gap (not part of this plan, flagging for awareness)

The frontend gate has never been backed by a server-side check: `ChatWebSocketHandler.handleSendMessage` / `ChatService.sendMessage` (backend) accept messages regardless of verification level — only group membership and block status are checked. This plan only relocates the *UI* gate; it doesn't close that gap. If you want it closed, that's a separate backend change (add a `verificationLevel >= 2` check in `ChatService.sendMessage`, likely sourced from `OrganizationMember.verificationLevel` for the sender's membership row) — say the word and I'll draft that as its own plan.
