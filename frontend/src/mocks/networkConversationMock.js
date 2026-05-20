import { CONVERSATION_STATUS } from './networkConversationConstants';

/**
 * 5 thành viên demo — memberId 9001–9005.
 * Hiển thị đầu grid Network để test từng case.
 */
export const MOCK_NETWORK_DEMO_MEMBERS = [
  {
    memberId: 9001,
    fullName: '[Demo] Case 1 — Chưa nhắn',
    startYear: 2020,
    program: 'Demo',
    major: 'NONE — gửi lời chào mới',
    avatarUrl: null,
    demoCase: 'NONE',
  },
  {
    memberId: 9002,
    fullName: '[Demo] Case 2 — Đang chờ (mình gửi)',
    startYear: 2019,
    program: 'Demo',
    major: 'PENDING — đã gửi 2/3 tin',
    avatarUrl: null,
    demoCase: 'PENDING_INITIATOR',
  },
  {
    memberId: 9003,
    fullName: '[Demo] Case 3 — Lời mời đến',
    startYear: 2018,
    program: 'Demo',
    major: 'PENDING — chấp nhận / từ chối',
    avatarUrl: null,
    demoCase: 'PENDING_RECIPIENT',
  },
  {
    memberId: 9004,
    fullName: '[Demo] Case 4 — Đã kết nối',
    startYear: 2017,
    program: 'Demo',
    major: 'ACTIVE — chat tự do',
    avatarUrl: null,
    demoCase: 'ACTIVE',
  },
  {
    memberId: 9005,
    fullName: '[Demo] Case 5 — Đã từ chối',
    startYear: 2016,
    program: 'Demo',
    major: 'DECLINED — không gửi thêm',
    avatarUrl: null,
    demoCase: 'DECLINED',
  },
];

/** currentMemberId mặc định trong seed (user thật lấy từ JWT) */
export const MOCK_SEED_CURRENT_MEMBER_ID = 100;

function msg(id, senderMemberId, body, minutesAgo = 0) {
  return {
    id,
    senderMemberId,
    body,
    createdAt: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
  };
}

/**
 * Seed ban đầu cho store — 5 case.
 * @returns {Map<number, object>}
 */
export function buildInitialConversationMap() {
  const me = MOCK_SEED_CURRENT_MEMBER_ID;
  const map = new Map();

  map.set(9001, {
    conversationId: null,
    peerMemberId: 9001,
    status: CONVERSATION_STATUS.NONE,
    initiatedByMemberId: null,
    messages: [],
  });

  map.set(9002, {
    conversationId: 10002,
    peerMemberId: 9002,
    status: CONVERSATION_STATUS.PENDING,
    initiatedByMemberId: me,
    messages: [
      msg(1, me, 'Chào bạn, mình là cựu sinh viên K19.', 120),
      msg(2, me, 'Bạn có rảnh trao đổi về ngành không?', 90),
    ],
  });

  map.set(9003, {
    conversationId: 10003,
    peerMemberId: 9003,
    status: CONVERSATION_STATUS.PENDING,
    initiatedByMemberId: 9003,
    messages: [
      msg(3, 9003, 'Xin chào! Mình thấy profile bạn rất phù hợp.', 60),
      msg(4, 9003, 'Bạn có muốn trao đổi về cơ hội việc làm không?', 45),
    ],
  });

  map.set(9004, {
    conversationId: 10004,
    peerMemberId: 9004,
    status: CONVERSATION_STATUS.ACTIVE,
    initiatedByMemberId: me,
    messages: [
      msg(5, me, 'Chào bạn!', 300),
      msg(6, 9004, 'Chào, rất vui được kết nối.', 280),
      msg(7, me, 'Cuối tuần bạn rảnh meet online không?', 240),
      msg(8, 9004, 'Thứ 7 chiều được nhé.', 200),
    ],
  });

  map.set(9005, {
    conversationId: 10005,
    peerMemberId: 9005,
    status: CONVERSATION_STATUS.DECLINED,
    initiatedByMemberId: 9005,
    messages: [
      msg(9, 9005, 'Chào bạn, mình muốn kết nối.', 400),
      msg(10, me, 'Xin lỗi, hiện tại mình chưa tiện trao đổi.', 380),
    ],
  });

  return map;
}
