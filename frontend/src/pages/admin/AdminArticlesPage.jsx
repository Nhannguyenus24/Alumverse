import {
  Box,
  Chip,
  CircularProgress,
  Button,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router';
import { useDebounce } from '../../hooks/useDebounce';
import AdminDataTable from '../../components/admin/AdminDataTable';
import useAdminArticles from '../../hooks/admin/useAdminArticles';
import { useAdminSystemContext } from '../../stores/AdminStore';
import { useOrgNavigate, useOrgPath } from '../../hooks/useOrgNavigate';
import { formatDateTime } from '../../utils/dateFormatter';

const CHANNEL_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'news', label: 'Tin tức' },
  { value: 'alumni', label: 'Cựu sinh viên' },
  { value: 'achievement', label: 'Kênh thành tựu' },
  { value: 'job', label: 'Cơ hội việc làm' },
  { value: 'learning', label: 'Cơ hội học tập' },
];

const CREATE_CHANNEL_OPTIONS = [
  { value: 'news', label: 'Tin tức', icon: <ArticleOutlinedIcon fontSize="small" /> },
  { value: 'alumni', label: 'Cựu sinh viên', icon: <GroupsOutlinedIcon fontSize="small" /> },
  { value: 'achievement', label: 'Kênh thành tựu', icon: <EmojiEventsOutlinedIcon fontSize="small" /> },
  { value: 'job', label: 'Cơ hội việc làm', icon: <WorkOutlineOutlinedIcon fontSize="small" /> },
  { value: 'learning', label: 'Cơ hội học tập', icon: <SchoolOutlinedIcon fontSize="small" /> },
];

const titleOf = (a) => a.title || a.name || a.position || '-';
const idOf = (a) => a.id;
const createdOf = (a) =>
  a.createdAt
  || a.created_at
  || a.publishedAt
  || a.awardedDate
  || a.timeStarted
  || a.eventDate
  || a.deadline;
const channelOf = (a, fallbackChannel) => a.channel || fallbackChannel;
const channelLabelOf = (value) =>
  CHANNEL_OPTIONS.find((item) => item.value === value)?.label ?? value ?? '-';

const AdminArticlesPage = () => {
  const { setBreadcrumbs } = useOutletContext();
  const navigate = useOrgNavigate();
  const toOrgPath = useOrgPath();
  const { stableOrgId } = useAdminSystemContext();
  const {
    channel, setChannel,
    articles, totalItems, loading,
    page, setPage,
    rowsPerPage, setRowsPerPage,
    search: backendSearch, setSearch: setBackendSearch,
    sortOrder, setSortOrder,
  } = useAdminArticles('all', stableOrgId);

  const [searchTerm, setSearchTerm] = useState(backendSearch);
  const [createAnchorEl, setCreateAnchorEl] = useState(null);
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    // Bỏ qua nếu giá trị không thay đổi (tránh double API call khi đổi channel)
    if (debouncedSearch === backendSearch) return;
    setBackendSearch(debouncedSearch);
    setPage(0); // reset về trang đầu khi keyword thay đổi
  }, [debouncedSearch, backendSearch, setBackendSearch, setPage]);

  useEffect(() => {
    setBreadcrumbs?.([{ label: 'Bài viết', active: true }]);
  }, [setBreadcrumbs]);

  const openInNewTab = (path) => {
    window.open(toOrgPath(path), '_blank', 'noopener,noreferrer');
  };

  const openEdit = (a) => openInNewTab(`/admin/article/${channelOf(a, channel)}/${idOf(a)}/edit`);
  const openView = (a) => openInNewTab(`/article/${channelOf(a, channel)}/${idOf(a)}`);
  const handleCreateArticle = (itemChannel) => {
    setCreateAnchorEl(null);
    navigate(`/post/${itemChannel}`);
  };

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
            Quản lý bài viết
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: 500 }}
          >
            Quản lý 5 kênh: Tin tức, Cựu sinh viên, Kênh thành tựu, Cơ hội học tập và Cơ hội việc làm. Sự kiện và Quyên góp có tab riêng để xử lý.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          onClick={(event) => setCreateAnchorEl(event.currentTarget)}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          Tạo bài viết
        </Button>
        <Menu
          anchorEl={createAnchorEl}
          open={Boolean(createAnchorEl)}
          onClose={() => setCreateAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {CREATE_CHANNEL_OPTIONS.map((item) => (
            <MenuItem key={item.value} onClick={() => handleCreateArticle(item.value)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText>{item.label}</ListItemText>
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress size={28} /></Stack>
      ) : (
        <AdminDataTable
          columns={[
            { id: "id", label: "ID", render: (_, a) => idOf(a) },
            {
              id: "title",
              label: 'Tiêu đề',
              render: (_, a) => (
                <Typography variant="body2" noWrap sx={{ maxWidth: 360 }}>
                  {titleOf(a)}
                </Typography>
              ),
            },
            {
              id: "channel",
              label: "Loại",
              render: (value, a) => (
                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  label={channelLabelOf(value || channelOf(a, channel))}
                  sx={{ fontWeight: 700 }}
                />
              ),
            },
            {
              id: "createdAt",
              label: 'Ngày tạo',
              render: (_, a) => formatDateTime(createdOf(a)),
            },
            {
              id: "actions",
              label: 'Thao tác',
              align: "right",
              render: (_, a) => (
                <Box
                  sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Tooltip title="Xem trang công khai">
                    <IconButton size="small" sx={{ color: 'primary.main' }} onClick={() => openView(a)}>
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Chỉnh sửa">
                    <IconButton size="small" sx={{ color: 'secondary.main' }} onClick={() => openEdit(a)}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ),
            },
          ]}
          rows={articles}
          getRowId={(row, idx) => `${channelOf(row, channel)}-${idOf(row) ?? idx}`}
          totalCount={totalItems}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
          onSearchChange={(val) => {
            setSearchTerm(val);
            setPage(0);
          }}
          searchValue={searchTerm}
          searchPlaceholder="Tìm kiếm tiêu đề..."
          onRowClick={(a) => openEdit(a)}
          filters={
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                select
                size="small"
                label="Kênh"
                value={channel}
                onChange={(e) => {
                  setChannel(e.target.value);
                  setSearchTerm('');
                  setBackendSearch('');
                }}
                sx={{ minWidth: 220 }}
              >
                {CHANNEL_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="Sắp xếp"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="DESC">Mới nhất</MenuItem>
                <MenuItem value="ASC">Cũ nhất</MenuItem>
              </TextField>
            </Stack>
          }
        />
      )}
    </Box>
  );
};

export default AdminArticlesPage;
