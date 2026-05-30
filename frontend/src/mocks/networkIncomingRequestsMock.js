import { CONVERSATION_REQUEST_STATUS } from '../constants/conversationRequestStatus';

/** Mock data — thay bằng API khi backend sẵn sàng. */
export const MOCK_INCOMING_REQUESTS = [
  {
    id: 1,
    requesterMemberId: 201,
    avatarUrl: '',
    fullName: 'Nguyễn Minh An',
    program: 'Regular',
    major: 'Computer Science',
    status: CONVERSATION_REQUEST_STATUS.PENDING,
    sentAt: '2026-05-28T09:15:00',
    messages: [
      {
        id: 1001,
        body: 'Chào bạn, mình cũng học ngành CNTT khóa gần với bạn. Rất mong được trao đổi thêm về định hướng nghề nghiệp.',
        senderMemberId: 201,
        createdAt: '2026-05-28T09:15:00',
      },
    ],
  },
  {
    id: 2,
    requesterMemberId: 202,
    avatarUrl: '',
    fullName: 'Trần Thị Bảo Ngọc',
    program: 'Advanced Program',
    major: 'Information Systems',
    status: CONVERSATION_REQUEST_STATUS.PENDING,
    sentAt: '2026-05-27T14:30:00',
    messages: [
      {
        id: 1002,
        body: 'Xin chào, mình thấy profile của bạn trên hệ thống và muốn kết nối để hỏi thêm về chương trình học.',
        senderMemberId: 202,
        createdAt: '2026-05-27T14:30:00',
      },
      {
        id: 1003,
        body: 'Nếu bạn rảnh, mình rất cảm ơn khi bạn có thể chia sẻ kinh nghiệm thực tập.',
        senderMemberId: 202,
        createdAt: '2026-05-27T14:31:00',
      },
    ],
  },
  {
    id: 3,
    requesterMemberId: 203,
    avatarUrl: '',
    fullName: 'Lê Hoàng Phúc',
    program: 'Regular',
    major: 'Data Science',
    status: CONVERSATION_REQUEST_STATUS.ACCEPTED,
    sentAt: '2026-05-20T10:00:00',
    messages: [
      {
        id: 1004,
        body: 'Chào bạn, mình là cựu sinh viên ngành Data Science. Rất vui nếu được kết nối.',
        senderMemberId: 203,
        createdAt: '2026-05-20T10:00:00',
      },
    ],
  },
  {
    id: 4,
    requesterMemberId: 204,
    avatarUrl: '',
    fullName: 'Phạm Quốc Huy',
    program: 'Regular',
    major: 'Computer Science',
    status: CONVERSATION_REQUEST_STATUS.REJECTED,
    sentAt: '2026-05-15T16:45:00',
    messages: [
      {
        id: 1005,
        body: 'Hi, mình muốn trao đổi về dự án tốt nghiệp. Bạn có rảnh không?',
        senderMemberId: 204,
        createdAt: '2026-05-15T16:45:00',
      },
    ],
  },
  {
    id: 5,
    requesterMemberId: 205,
    avatarUrl: '',
    fullName: 'Võ Thanh Hà',
    program: 'Advanced Program',
    major: 'Computer Science',
    status: CONVERSATION_REQUEST_STATUS.PENDING,
    sentAt: '2026-05-29T08:20:00',
    messages: [
      {
        id: 1006,
        body: 'Chào bạn, mình đang tìm mentor trong ngành backend. Bạn có thể kết nối với mình không?',
        senderMemberId: 205,
        createdAt: '2026-05-29T08:20:00',
      },
    ],
  },
  {
    id: 6,
    requesterMemberId: 206,
    avatarUrl: '',
    fullName: 'Đặng Kim Liên',
    program: 'Regular',
    major: 'Information Systems',
    status: CONVERSATION_REQUEST_STATUS.ACCEPTED,
    sentAt: '2026-05-10T11:00:00',
    messages: [
      {
        id: 1007,
        body: 'Xin chào, mình rất quan tâm đến lộ trình chuyển sang product management.',
        senderMemberId: 206,
        createdAt: '2026-05-10T11:00:00',
      },
    ],
  },
];
