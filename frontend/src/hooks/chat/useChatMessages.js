import { useState, useEffect, useCallback, useRef } from 'react';

import { chatApi } from '../../utils/api';

const PAGE_SIZE = 10;
const RESET_MESSAGE_CHANGE = { type: 'reset', sequence: 0, message: null };

const createInitialChatState = (groupId = null) => ({
  groupId,
  status: groupId == null ? 'idle' : 'loading',
  messages: [],
  page: 0,
  hasMore: false,
  messageChange: RESET_MESSAGE_CHANGE,
});

const compareMessagesChronologically = (left, right) => {
  const leftTime = new Date(left.createdAt).getTime();
  const rightTime = new Date(right.createdAt).getTime();

  if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  const leftId = left.id;
  const rightId = right.id;
  if (leftId == null || rightId == null || leftId === rightId) return 0;
  if (typeof leftId === 'number' && typeof rightId === 'number') return leftId - rightId;
  return String(leftId).localeCompare(String(rightId), undefined, { numeric: true });
};

// REST and WebSocket can deliver the same message while the initial request is
// in flight. Keep the live copy's current fields, fill any missing fields from
// REST, and return one deterministic oldest-first list.
const mergeInitialMessages = (fetched, current) => {
  const byId = new Map();
  const messagesWithoutId = [];

  fetched.forEach((message) => {
    if (message.id == null) messagesWithoutId.push(message);
    else byId.set(message.id, message);
  });
  current.forEach((message) => {
    if (message.id == null) messagesWithoutId.push(message);
    else byId.set(message.id, { ...byId.get(message.id), ...message });
  });

  return [...byId.values(), ...messagesWithoutId].sort(compareMessagesChronologically);
};

/**
 * Loads messages for a chat group with "load older" pagination.
 *
 * Backend returns DESC (newest first). This hook reverses each page before
 * accumulating so the final `messages` array is always oldest-first (for
 * normal top-to-bottom chat display).
 *
 * Page 0 = newest PAGE_SIZE messages.
 * Calling `loadMore()` fetches the next page (older messages) and prepends them.
 *
 * @param {number|null} groupId
 */
export function useChatMessages(groupId) {
  const [chatState, setChatState] = useState(() => createInitialChatState(groupId));
  const [loadingMoreGroupId, setLoadingMoreGroupId] = useState(null);

  const activeGroupId = useRef(null);
  const messageIds = useRef(new Set());
  const changeSequence = useRef(0);
  const initialRequestSequence = useRef(0);

  const createMessageChange = useCallback((type, message = null) => {
    changeSequence.current += 1;
    return { type, sequence: changeSequence.current, message };
  }, []);

  const isCurrentGroup = groupId != null && chatState.groupId === groupId;
  const messages = isCurrentGroup ? chatState.messages : [];
  const messageChange = isCurrentGroup ? chatState.messageChange : RESET_MESSAGE_CHANGE;
  const hasMore = isCurrentGroup ? chatState.hasMore : false;
  const isLoading = groupId != null && (!isCurrentGroup || chatState.status === 'loading');
  const isLoadingMore = isCurrentGroup && loadingMoreGroupId === groupId;

  useEffect(() => {
    activeGroupId.current = groupId;
    messageIds.current = new Set();
    const requestSequence = ++initialRequestSequence.current;

    if (groupId == null) {
      return;
    }

    chatApi
      .getMessages(groupId, 0, PAGE_SIZE)
      .then((items) => {
        if (
          activeGroupId.current !== groupId
          || initialRequestSequence.current !== requestSequence
        ) return;
        const displayOrder = [...items].reverse();
        const messageChangeForInitial = createMessageChange('initial');
        setChatState((prev) => {
          const currentMessages = prev.groupId === groupId ? prev.messages : [];
          const mergedMessages = mergeInitialMessages(displayOrder, currentMessages);
          messageIds.current = new Set([
            ...messageIds.current,
            ...mergedMessages.map((item) => item.id).filter((id) => id != null),
          ]);
          return {
            groupId,
            status: 'ready',
            messages: mergedMessages,
            page: 0,
            hasMore: items.length === PAGE_SIZE,
            messageChange: messageChangeForInitial,
          };
        });
      })
      .catch(() => {
        if (
          activeGroupId.current !== groupId
          || initialRequestSequence.current !== requestSequence
        ) return;
        const messageChangeForInitial = createMessageChange('initial');
        setChatState((prev) => {
          const currentMessages = prev.groupId === groupId ? prev.messages : [];
          messageIds.current = new Set([
            ...messageIds.current,
            ...currentMessages.map((item) => item.id).filter((id) => id != null),
          ]);
          return {
            ...createInitialChatState(groupId),
            status: 'ready',
            messages: currentMessages,
            messageChange: messageChangeForInitial,
          };
        });
      });

    return () => {
      if (activeGroupId.current === groupId) activeGroupId.current = null;
    };
  }, [groupId, createMessageChange]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || groupId == null) return;

    // Derive the page from how many messages we currently hold rather than a
    // running counter. Realtime messages append at the newest end and shift the
    // server's DESC offset window; counting loaded messages keeps the next fetch
    // aligned, so a full page never comes back as pure overlap (which would leave
    // pagination stalled with hasMore still true and no scroll growth).
    const nextPage = Math.floor(messages.length / PAGE_SIZE);
    setLoadingMoreGroupId(groupId);

    chatApi
      .getMessages(groupId, nextPage, PAGE_SIZE)
      .then((items) => {
        if (activeGroupId.current !== groupId) return;
        const older = [...items].reverse();
        const messageChangeForPrepend = createMessageChange('prepend');
        setChatState((prev) => {
          if (prev.groupId !== groupId) return prev;
          const knownIds = new Set(
            prev.messages.map((item) => item.id).filter((id) => id != null),
          );
          const uniqueOlder = older.filter((item) => {
            if (item.id == null) return true;
            if (knownIds.has(item.id)) return false;
            knownIds.add(item.id);
            return true;
          });
          messageIds.current = new Set([...messageIds.current, ...knownIds]);
          return {
            ...prev,
            messages: [...uniqueOlder, ...prev.messages],
            page: nextPage,
            // Pagination must be based on the raw server page. A full page can
            // contain overlap after realtime inserts shift the offset, but an
            // additional older page may still exist.
            hasMore: items.length === PAGE_SIZE,
            messageChange: messageChangeForPrepend,
          };
        });
      })
      .catch(() => {})
      .finally(() => {
        setLoadingMoreGroupId((current) => current === groupId ? null : current);
      });
  }, [groupId, messages.length, hasMore, isLoadingMore, createMessageChange]);

  const appendMessage = useCallback((msg) => {
    if (groupId == null || activeGroupId.current !== groupId) return;
    if (msg.id != null && messageIds.current.has(msg.id)) return;
    if (msg.id != null) messageIds.current.add(msg.id);
    const messageChangeForAppend = createMessageChange('append', msg);
    setChatState((prev) => {
      if (prev.groupId !== groupId) {
        if (msg.id != null) messageIds.current.add(msg.id);
        return {
          ...createInitialChatState(groupId),
          messages: [msg],
          messageChange: messageChangeForAppend,
        };
      }
      if (msg.id != null && prev.messages.some((message) => message.id === msg.id)) return prev;
      if (msg.id != null) messageIds.current.add(msg.id);
      return {
        ...prev,
        messages: [...prev.messages, msg],
        messageChange: messageChangeForAppend,
      };
    });
  }, [groupId, createMessageChange]);

  // Flip the seen flag on messages a peer has now read (created at or before `readAt`, or all
  // loaded messages when `readAt` is missing). Used to turn "Sent" into "Seen" live.
  const markPeerSeen = useCallback((readAt) => {
    const readTime = readAt ? new Date(readAt).getTime() : null;
    setChatState((prev) => {
      if (prev.groupId !== groupId) return prev;
      let changed = false;
      const nextMessages = prev.messages.map((m) => {
        if (m.seenByPeer) return m;
        if (readTime != null && new Date(m.createdAt).getTime() > readTime) return m;
        changed = true;
        return { ...m, seenByPeer: true };
      });
      return changed ? { ...prev, messages: nextMessages } : prev;
    });
  }, [groupId]);

  // Re-fetches the newest messages and merges them in, deduped by id.
  // Used after a WebSocket reconnect to pick up messages sent by others
  // while this client was fully offline (a gap re-JOIN alone can't close,
  // since there was no live connection to push to during that window).
  const resyncMessages = useCallback(() => {
    if (groupId == null) return;
    const targetGroupId = groupId;
    chatApi
      .getMessages(targetGroupId, 0, PAGE_SIZE)
      .then((items) => {
        if (activeGroupId.current !== targetGroupId) return;
        const fetched = [...items].reverse();
        fetched.forEach((item) => {
          if (item.id != null) messageIds.current.add(item.id);
        });
        const messageChangeForResync = createMessageChange('resync');
        setChatState((prev) => {
          if (prev.groupId !== targetGroupId) return prev;
          const byId = new Map(prev.messages.map((m) => [m.id, m]));
          fetched.forEach((m) => byId.set(m.id, m));
          return {
            ...prev,
            messages: Array.from(byId.values()).sort((a, b) => a.id - b.id),
            messageChange: messageChangeForResync,
          };
        });
      })
      .catch(() => {});
  }, [groupId, createMessageChange]);

  return {
    messages,
    messageChange,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    appendMessage,
    resyncMessages,
    markPeerSeen,
  };
}
