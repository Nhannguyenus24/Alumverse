export function invalidateChatListQueries(queryClient) {
  queryClient.invalidateQueries({ queryKey: ['groupChatList'] });
  queryClient.invalidateQueries({ queryKey: ['privateChatList'] });
  queryClient.invalidateQueries({ queryKey: ['recentChatPreviews'] });
}
