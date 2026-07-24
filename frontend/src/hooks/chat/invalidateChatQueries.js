export function invalidateChatListQueries(queryClient) {
  queryClient.invalidateQueries({ queryKey: ['groupChatList'] });
  queryClient.invalidateQueries({ queryKey: ['privateChatList'] });
  queryClient.invalidateQueries({ queryKey: ['recentChatPreviews'] });
}

const CHAT_LIST_KEYS = [['groupChatList'], ['privateChatList']];

/**
 * Optimistically fold an incoming message into every cached chat-list page so the left
 * column updates in real time (new preview text + bumped last-message time, which also
 * re-sorts the merged list) without a refetch. When `markUnread` is true the matching
 * conversation's unread count is incremented so the sidebar can flag it.
 *
 * Returns true if the conversation was found in at least one cached page. A false return
 * means the conversation is not currently cached (e.g. a brand-new chat, or one on a page
 * the user hasn't loaded) and the caller should invalidate to pull it in.
 */
export function applyIncomingMessageToChatLists(queryClient, { chatId, preview, createdAt, markUnread }) {
  let matched = false;
  CHAT_LIST_KEYS.forEach((queryKey) => {
    queryClient.setQueriesData({ queryKey }, (old) => {
      if (!old?.items?.length) return old;
      let changed = false;
      const items = old.items.map((item) => {
        if (String(item.id) !== String(chatId)) return item;
        matched = true;
        changed = true;
        return {
          ...item,
          lastMessagePreview: preview ?? item.lastMessagePreview,
          lastMessageAt: createdAt ?? item.lastMessageAt,
          unreadCount: markUnread ? (Number(item.unreadCount) || 0) + 1 : item.unreadCount,
        };
      });
      return changed ? { ...old, items } : old;
    });
  });
  return matched;
}

/** Zero the unread count of a conversation across every cached chat-list page. */
export function resetChatUnreadInLists(queryClient, chatId) {
  CHAT_LIST_KEYS.forEach((queryKey) => {
    queryClient.setQueriesData({ queryKey }, (old) => {
      if (!old?.items?.length) return old;
      let changed = false;
      const items = old.items.map((item) => {
        if (String(item.id) !== String(chatId) || !item.unreadCount) return item;
        changed = true;
        return { ...item, unreadCount: 0 };
      });
      return changed ? { ...old, items } : old;
    });
  });
}

export function invalidateGroupBlockedMembersQueries(queryClient) {
  queryClient.invalidateQueries({ queryKey: ['chat', 'group-blocked-members'] });
}
