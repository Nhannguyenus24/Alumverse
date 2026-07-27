import { useState, useEffect, useCallback, useRef } from 'react';

import { chatApi } from '../../utils/api';

const PAGE_SIZE = 10;

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
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const activeGroupId = useRef(null);

  useEffect(() => {
    if (groupId == null) {
      setMessages([]);
      setPage(0);
      setHasMore(false);
      return;
    }

    activeGroupId.current = groupId;
    setMessages([]);
    setPage(0);
    setHasMore(false);
    setIsLoading(true);

    chatApi
      .getMessages(groupId, 0, PAGE_SIZE)
      .then((items) => {
        if (activeGroupId.current !== groupId) return;
        const displayOrder = [...items].reverse();
        setMessages(displayOrder);
        setHasMore(items.length === PAGE_SIZE);
        setPage(0);
      })
      .catch(() => {
        if (activeGroupId.current !== groupId) return;
        setMessages([]);
        setHasMore(false);
      })
      .finally(() => {
        if (activeGroupId.current !== groupId) return;
        setIsLoading(false);
      });
  }, [groupId]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || groupId == null) return;

    const nextPage = page + 1;
    setIsLoadingMore(true);

    chatApi
      .getMessages(groupId, nextPage, PAGE_SIZE)
      .then((items) => {
        if (activeGroupId.current !== groupId) return;
        const older = [...items].reverse();
        setMessages((prev) => [...older, ...prev]);
        setHasMore(items.length === PAGE_SIZE);
        setPage(nextPage);
      })
      .catch(() => {})
      .finally(() => {
        if (activeGroupId.current !== groupId) return;
        setIsLoadingMore(false);
      });
  }, [groupId, page, hasMore, isLoadingMore]);

  const appendMessage = useCallback((msg) => {
    setMessages((prev) => {
      if (msg.id != null && prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  // Flip the seen flag on messages a peer has now read (created at or before `readAt`, or all
  // loaded messages when `readAt` is missing). Used to turn "Sent" into "Seen" live.
  const markPeerSeen = useCallback((readAt) => {
    const readTime = readAt ? new Date(readAt).getTime() : null;
    setMessages((prev) => {
      let changed = false;
      const next = prev.map((m) => {
        if (m.seenByPeer) return m;
        if (readTime != null && new Date(m.createdAt).getTime() > readTime) return m;
        changed = true;
        return { ...m, seenByPeer: true };
      });
      return changed ? next : prev;
    });
  }, []);

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
        setMessages((prev) => {
          const byId = new Map(prev.map((m) => [m.id, m]));
          fetched.forEach((m) => byId.set(m.id, m));
          return Array.from(byId.values()).sort((a, b) => a.id - b.id);
        });
      })
      .catch(() => {});
  }, [groupId]);

  return { messages, isLoading, isLoadingMore, hasMore, loadMore, appendMessage, resyncMessages, markPeerSeen };
}
