import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import { ADMIN_FILTER_BAR_SX, ADMIN_STATUS_CHIP_SX } from '../../constants/adminUiShared';
import useAdminArticles from '../../hooks/admin/useAdminArticles';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { formatDateTime } from '../../utils/dateFormatter';

const CHANNEL_OPTIONS = [
  { value: 'news', label: 'Tin tức' },
  { value: 'alumni', label: 'Cựu sinh viên' },
  { value: 'achievement', label: 'Thành tựu' },
  { value: 'job', label: 'Việc làm' },
  { value: 'learning', label: 'Học bổng / Học tập' },
  { value: 'event', label: 'Sự kiện' },
  { value: 'donation', label: 'Quyên góp' },
];

const channelLabel = (v) => CHANNEL_OPTIONS.find((c) => c.value === v)?.label ?? v;

const titleOf = (a) => a.title || a.name || a.position || '-';
const idOf = (a) => a.id;
const createdOf = (a) => a.createdAt || a.created_at || a.timeStarted || a.eventDate || a.publishedAt;

const AdminArticlesPage = () => {
  const navigate = useOrgNavigate();
  const {
    channel, setChannel,
    articles, totalItems, loading,
    page, setPage,
    rowsPerPage, setRowsPerPage,
  } = useAdminArticles('news');

  const openEdit = (a) => navigate(`/admin/article/${channel}/${idOf(a)}/edit`);
  const openView = (a) => navigate(`/article/${channel}/${idOf(a)}`);

  return (
    <AdminSectionPanel
      title="Article management"
      subtitle="Edit any published article across the 7 channels — reuses the post-article form layout."
    >
      <Box sx={ADMIN_FILTER_BAR_SX}>
        <TextField
          select size="small" label="Channel"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          {CHANNEL_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </TextField>
        <Chip label={channelLabel(channel)} color="primary" sx={ADMIN_STATUS_CHIP_SX} />
      </Box>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress size={28} /></Stack>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Created at</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No articles in this channel yet.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              articles.map((a) => (
                <TableRow key={idOf(a)} hover sx={{ cursor: 'pointer' }} onClick={() => openEdit(a)}>
                  <TableCell>{idOf(a)}</TableCell>
                  <TableCell sx={{ maxWidth: 360 }}>
                    <Typography variant="body2" noWrap>{titleOf(a)}</Typography>
                  </TableCell>
                  <TableCell>{formatDateTime(createdOf(a))}</TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      <Tooltip title="View public page">
                        <IconButton size="small" color="primary" onClick={() => openView(a)}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={() => openEdit(a)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <TablePagination
        component="div"
        count={totalItems}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
        rowsPerPageOptions={[10, 20, 50]}
      />
    </AdminSectionPanel>
  );
};

export default AdminArticlesPage;
