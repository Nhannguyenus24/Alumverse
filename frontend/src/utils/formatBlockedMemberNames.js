const MAX_NAMES_SHOWN = 2;

function formatBlockedMemberNames(members, maxShown = MAX_NAMES_SHOWN) {
  if (!members?.length) return '';

  const names = members.map((member) => member.fullName?.trim() || `User ${member.memberId}`);

  if (names.length <= maxShown) {
    return names.join(', ');
  }

  const shown = names.slice(0, maxShown).join(', ');
  const restCount = names.length - maxShown;
  return `${shown} và ${restCount} người khác`;
}

export function buildGroupBlockedMembersBannerMessage(blockedMembers, isOwner) {
  const names = formatBlockedMemberNames(blockedMembers);
  if (!names) return null;

  const base = `Bạn đã chặn ${names}. Bạn và họ vẫn có thể nhắn tin trong nhóm.`;

  if (isOwner) {
    return `${base} Bạn có thể xóa thành viên khỏi nhóm hoặc rời nhóm trong Quản lý thành viên.`;
  }

  return `${base} Bạn có thể rời nhóm trong Quản lý thành viên.`;
}
