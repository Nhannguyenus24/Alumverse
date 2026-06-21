import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router';
import { useDebounce } from '../../hooks/useDebounce';
import AdminDataTable from '../../components/admin/AdminDataTable';
import { ADMIN_STATUS_CHIP_SX } from '../../constants/adminUiShared';
import useAdminArticles from '../../hooks/admin/useAdminArticles';
import { useAdminSystemContext } from '../../stores/AdminStore';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { formatDateTime } from '../../utils/dateFormatter';

const CHANNEL_OPTIONS = [
  { value: 'news', label: 'Tin tức' },
  { value: 'alumni', label: 'Cựu sinh viên' },
  { value: 'achievement', label: 'Kênh thành tựu' },
  { value: 'job', label: 'Cơ hội việc làm' },
  { value: 'learning', label: 'Cơ hội học tập' },
  { value: 'event', label: 'Sự kiện' },
  { value: 'donation', label: 'Quyên góp' },
];



const titleOf = (a) => a.title || a.name || a.position || '-';
const idOf = (a) => a.id;
const createdOf = (a) => a.createdAt || a.created_at || a.timeStarted || a.eventDate || a.publishedAt;

const AdminArticlesPage = () => {
  const { setBreadcrumbs } = useOutletContext();
  const navigate = useOrgNavigate();
  const { stableOrgId } = useAdminSystemContext();
  const {
    channel, setChannel,
    articles, totalItems, loading,
    page, setPage,
    rowsPerPage, setRowsPerPage,
    search: backendSearch, setSearch: setBackendSearch,
  } = useAdminArticles('news', stableOrgId);

  const [searchTerm, setSearchTerm] = useState(backendSearch);
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

  const openEdit = (a) => navigate(`/admin/article/${channel}/${idOf(a)}/edit`);
  const openView = (a) => navigate(`/article/${channel}/${idOf(a)}`);

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
            Chỉnh sửa bất kỳ bài viết nào đã đăng trên 7 chuyên mục.
          </Typography>
        </Box>
      </Box>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress size={28} /></Stack>
      ) : (
        <AdminDataTable
          columns={[
            { id: "id", label: "ID", render: (_, a) => idOf(a) },
            {
              id: "title",
              label: "Tiêu đề",
              render: (_, a) => (
                <Typography variant="body2" noWrap sx={{ maxWidth: 360 }}>
                  {titleOf(a)}
                </Typography>
              ),
            },
            {
              id: "createdAt",
              label: "Ngày tạo",
              render: (_, a) => formatDateTime(createdOf(a)),
            },
            {
              id: "actions",
              label: "Thao tác",
              align: "right",
              render: (_, a) => (
                <Box
                  sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Tooltip title="Xem trang công khai">
                    <IconButton size="small" color="primary" onClick={() => openView(a)}>
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Chỉnh sửa">
                    <IconButton size="small" color="primary" onClick={() => openEdit(a)}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ),
            },
          ]}
          rows={articles}
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
                label="Chuyên mục"
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
            </Stack>
          }
        />
      )}
    </Box>
  );
};

export default AdminArticlesPage;
