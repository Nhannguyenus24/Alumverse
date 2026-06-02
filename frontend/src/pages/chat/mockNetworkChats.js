/** Ảnh mặc định trong `public` khi không có `avatarUrl` hoặc ảnh API lỗi */
export const DEFAULT_CHAT_AVATAR_SRC = '/avatar_chat_fallback.svg';

/**
 * Mock hội thoại — thay bằng API khi backend sẵn sàng.
 *
 * `preview` ≈ nội dung tin nhắn cuối (`chat_messages.content`).
 * `updatedAt` ≈ `chat_messages.created_at` của tin cuối trong thread (group).
 * `avatarUrl` ≈ ảnh đại diện peer (API); null/undefined → `DEFAULT_CHAT_AVATAR_SRC`.
 */
export const MOCK_NETWORK_CHATS = [
  {
    id: 1,
    name: 'Le Minh Anh',
    avatarUrl: null,
    preview: 'Rat vui duoc ket noi voi ban.',
    updatedAt: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: 2,
    name: 'Tran Bao Khang',
    avatarUrl: null,
    preview: 'Dang mo vi tri internship frontend.',
    updatedAt: new Date(Date.now() - 32 * 60 * 1000),
  },
  {
    id: 3,
    name: 'Pham Gia Huy',
    avatarUrl: null,
    preview: 'Trao doi them ve du an community.',
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    id: 4,
    name: 'Hello my friend',
    avatarUrl: null,
    preview: 'Trao doi them ve du an community.',
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: 5,
    name: '12',
    avatarUrl: null,
    preview: 'Trao doi them ve du an community.',
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 6,
    name: '123',
    avatarUrl: null,
    preview: 'Trao doi them ve du an community.',
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
  {
    id: 7,
    name: '1234',
    avatarUrl: null,
    preview: 'Trao doi them ve du an community.',
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  },
  {
    id: 8,
    name: '12345',
    avatarUrl: null,
    preview: 'Trao doi them ve du an community.',
    updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
  },
];
