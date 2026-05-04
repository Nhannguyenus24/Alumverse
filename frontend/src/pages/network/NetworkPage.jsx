import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Container,
  Pagination,
  Stack,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChatIcon from '@mui/icons-material/Chat';
import { useLocation } from 'react-router';

import Page from '../../components/Page';
import Sidebar from '../../components/Sidebar';
import SearchBar from '../../components/SearchBar';
import NetworkChatPanel from '../../components/network/NetworkChatPanel';
import NetworkSearchMemberCard from '../../components/network/NetworkSearchMemberCard';
import NetworkChatSidebar from '../../components/network/NetworkChatSidebar';
import { formatRating } from '../../utils/numberFormatter';
import usePaginationScrollToTop from '../../hooks/usePaginationScrollToTop';

const SIDEBAR_ITEMS = [
  { id: '/network/search', label: 'Tìm kiếm', icon: <SearchIcon /> },
  { id: '/network/chat', label: 'Chat', icon: <ChatIcon /> },
];

const CHAT_ITEMS = [
  { id: 1, name: 'Le Minh Anh', preview: 'Rat vui duoc ket noi voi ban.' },
  { id: 2, name: 'Tran Bao Khang', preview: 'Dang mo vi tri internship frontend.' },
  { id: 3, name: 'Pham Gia Huy', preview: 'Trao doi them ve du an community.' },
  { id: 4, name: 'Hello my friend', preview: 'Trao doi them ve du an community.' },
  { id: 5, name: '12', preview: 'Trao doi them ve du an community.' },
  { id: 6, name: '123', preview: 'Trao doi them ve du an community.' },
  { id: 7, name: '1234', preview: 'Trao doi them ve du an community.' },
  { id: 8, name: '12345', preview: 'Trao doi them ve du an community.' },
];

/** Demo list — thay bằng gọi API khi backend sẵn sàng */
const PAGE_SIZE = 9;
const MOCK_NETWORK_MENTORS = Array.from({ length: 22 }, (_, i) => {
  const companies = ['VNG', 'FPT Software', 'TMA', 'Momo', 'Shopee', 'Global Alumni'];
  const titles = ['Senior Engineer', 'Product Manager', 'Tech Lead', 'Designer', 'Data Scientist'];
  const topicsPool = ['Frontend', 'Backend', 'Career', 'Interview', 'AI', 'Data', 'DevOps', 'Startup'];
  return {
    memberId: i + 1,
    avatarUrl: null,
    fullName: `Cựu SV ${i + 1} — ${['Minh', 'Lan', 'Hùng', 'Trang', 'Đức'][i % 5]} ${['Nguyễn', 'Trần', 'Phạm', 'Lê'][i % 4]}`,
    currentJobTitle: titles[i % titles.length],
    currentCompany: companies[i % companies.length],
    ratingAvg: 3.6 + (i % 13) * 0.05,
    totalSessions: 3 + ((i * 7) % 40),
    expertiseTopics: [topicsPool[i % topicsPool.length], topicsPool[(i + 3) % topicsPool.length]],
  };
});

function matchesMentorSearch(mentor, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    mentor.fullName,
    mentor.currentJobTitle,
    mentor.currentCompany,
    ...(mentor.expertiseTopics ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

const NetworkPage = () => {
  const location = useLocation();
  const isChatTab = location.pathname.endsWith('/network/chat');
  const [activeChatId, setActiveChatId] = useState(CHAT_ITEMS[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  /** Trang hiện tại 1-based (cùng convention DonationPage) */
  const [page, setPage] = useState(1);

  const activeChat = useMemo(
    () => CHAT_ITEMS.find((chat) => chat.id === activeChatId) ?? CHAT_ITEMS[0],
    [activeChatId],
  );

  const filteredMentors = useMemo(
    () => MOCK_NETWORK_MENTORS.filter((m) => matchesMentorSearch(m, searchQuery)),
    [searchQuery],
  );

  const pageCount =
    filteredMentors.length === 0
      ? 0
      : Math.max(1, Math.ceil(filteredMentors.length / PAGE_SIZE));

  const safePage = pageCount === 0 ? 1 : Math.min(page, pageCount);

  const mentorsOnPage = filteredMentors.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  useEffect(() => {
    if (pageCount === 0) return;
    setPage((p) => Math.min(p, pageCount));
  }, [pageCount]);

  const handlePageChange = usePaginationScrollToTop({ currentPage: safePage, setPage });

  return (
    <Page title="Network">
      <Container maxWidth={false} disableGutters sx={{ pb: isChatTab ? 0 : 6 }}>
        <Container
          maxWidth="xl"
          sx={{
            pt: isChatTab ? { xs: 1.5, sm: 2, md: 2 } : { xs: 2, sm: 3, md: 4 },
            px: { xs: 2, sm: 3, lg: 6 },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 3 } }}>
            <Stack spacing={2} sx={{ width: { xs: '100%', md: 260 } }}>
              <Sidebar items={SIDEBAR_ITEMS} />
            </Stack>

            <Stack
              spacing={isChatTab ? 1.5 : 3}
              sx={{
                flex: 1,
                minWidth: 0,
                width: '100%',
                minHeight: 0,
                px: { xs: 1.5, sm: 2, md: 2.75 },
              }}
            >
              <Typography
                variant="h1"
                fontWeight={800}
                color="primary.main"
                sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}
              >
                NETWORK
              </Typography>

              {isChatTab ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    overflow: 'hidden',
                    height: { xs: 'calc(100dvh - 230px)', md: 'calc(100dvh - 185px)' },
                    minHeight: 0,
                    bgcolor: 'background.paper',
                  }}
                >
                  <NetworkChatSidebar
                    chats={CHAT_ITEMS}
                    activeChatId={activeChat.id}
                    onSelectChat={setActiveChatId}
                  />
                  <NetworkChatPanel activeChat={activeChat} />
                </Box>
              ) : (
                <Stack spacing={3}>
                  <Typography color="text.secondary">
                    Tìm và kết nối với cựu sinh viên.
                  </Typography>

                  <Box>
                    <Typography variant="h4" fontWeight={700} mb={2}>
                      Tìm kiếm kết nối
                    </Typography>
                    <SearchBar
                      value={searchQuery}
                      onChange={(v) => {
                        setSearchQuery(v);
                        setPage(1);
                      }}
                      placeholder="Tìm theo tên"
                    />
                  </Box>

                  {mentorsOnPage.length === 0 ? (
                    <Alert severity="info">
                      {searchQuery.trim()
                        ? `Không có kết quả khớp “${searchQuery.trim()}”.`
                        : 'Chưa có người để hiển thị.'}
                    </Alert>
                  ) : (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: '1fr 1fr',
                          md: '1fr 1fr 1fr',
                        },
                        gap: 3,
                      }}
                    >
                      {mentorsOnPage.map((mentor) => (
                        <NetworkSearchMemberCard
                          key={mentor.memberId}
                          avatar={mentor.avatarUrl}
                          name={mentor.fullName ?? `Thành viên #${mentor.memberId}`}
                          role={
                            [mentor.currentJobTitle, mentor.currentCompany]
                              .filter(Boolean)
                              .join(' @ ') || 'Thành viên'
                          }
                          rating={formatRating(mentor.ratingAvg)}
                          reviews={mentor.totalSessions ?? 0}
                          tags={(mentor.expertiseTopics ?? []).slice(0, 3)}
                        />
                      ))}
                    </Box>
                  )}

                  {filteredMentors.length > 0 && (
                    <Stack
                      direction="row"
                      justifyContent="center"
                      alignItems="center"
                      sx={{ mt: 3.5 }}
                    >
                      <Pagination
                        count={pageCount || 1}
                        page={safePage}
                        onChange={handlePageChange}
                        color="primary"
                        shape="rounded"
                        size="large"
                        sx={{
                          '& .MuiPaginationItem-root': {
                            fontWeight: 700,
                            minWidth: 38,
                            height: 38,
                          },
                        }}
                      />
                    </Stack>
                  )}
                </Stack>
              )}
            </Stack>
          </Box>
        </Container>
      </Container>
    </Page>
  );
};

export default NetworkPage;
