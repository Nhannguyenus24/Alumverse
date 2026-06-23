const MAX_NAMES_SHOWN = 2;

function formatBlockedMemberNames(members, maxShown = MAX_NAMES_SHOWN, t = null) {
  if (!members?.length) return '';

  const names = members.map((member) => member.fullName?.trim() || `User ${member.memberId}`);

  if (names.length <= maxShown) {
    return names.join(', ');
  }

  const shown = names.slice(0, maxShown).join(', ');
  const restCount = names.length - maxShown;
  return t
    ? t('network:and_n_others', { count: restCount, shown })
    : `${shown} và ${restCount} người khác`;
}

/**
 * @param {Array} blockedMembers
 * @param {boolean} isOwner
 * @param {Function} [t] - optional i18next t function for translated messages
 */
export function buildGroupBlockedMembersBannerMessage(blockedMembers, isOwner, t = null) {
  const names = formatBlockedMemberNames(blockedMembers, MAX_NAMES_SHOWN, t);
  if (!names) return null;

  const base = t
    ? t('network:blocked_members_note', { names })
    : `Bạn đã chặn ${names}. Bạn và họ vẫn có thể nhắn tin trong nhóm.`;

  if (isOwner) {
    return t
      ? `${base} ${t('network:blocked_group_admin_note')}`
      : `${base} Bạn có thể xóa thành viên khỏi nhóm hoặc rời nhóm trong Settings.`;
  }

  return t
    ? `${base} ${t('network:blocked_group_member_note')}`
    : `${base} Bạn có thể rời nhóm trong Settings.`;
}
