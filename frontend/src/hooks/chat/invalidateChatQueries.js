export function invalidateChatListQueries(queryClient) {
  queryClient.invalidateQueries({ queryKey: ['groupChatList'] });
  queryClient.invalidateQueries({ queryKey: ['privateChatList'] });
  queryClient.invalidateQueries({ queryKey: ['recentChatPreviews'] });
}

export function invalidateGroupBlockedMembersQueries(queryClient) {
  queryClient.invalidateQueries({ queryKey: ['chat', 'group-blocked-members'] });
}
