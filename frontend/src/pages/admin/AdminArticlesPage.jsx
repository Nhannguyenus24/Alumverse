import { useTranslation } from 'react-i18next';
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

const getChannelOptions = (t) => [
  { value: 'news', label: t('admin:channel_news') },
  { value: 'alumni', label: t('admin:channel_alumni') },
  { value: 'achievement', label: t('admin:channel_achievement') },
  { value: 'job', label: t('admin:channel_job') },
  { value: 'learning', label: t('admin:channel_learning') },
  { value: 'event', label: t('admin:channel_event') },
  { value: 'donation', label: t('admin:channel_donation') },
];



const titleOf = (a) => a.title || a.name || a.position || '-';
const idOf = (a) => a.id;
const createdOf = (a) => a.createdAt || a.created_at || a.timeStarted || a.eventDate || a.publishedAt;

const AdminArticlesPage = () => {
  const { t } = useTranslation(['admin', 'common']);
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
    setBreadcrumbs?.([{ label: t('admin:articles'), active: true }]);
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
            {t('admin:manage_articles')}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: 500 }}
          >
            {t('admin:manage_articles_desc')}
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
              label: t('admin:col_title'),
              render: (_, a) => (
                <Typography variant="body2" noWrap sx={{ maxWidth: 360 }}>
                  {titleOf(a)}
                </Typography>
              ),
            },
            {
              id: "createdAt",
              label: t('admin:col_created_at'),
              render: (_, a) => formatDateTime(createdOf(a)),
            },
            {
              id: "actions",
              label: t('admin:col_actions'),
              align: "right",
              render: (_, a) => (
                <Box
                  sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Tooltip title={t('admin:view_public_page')}>
                    <IconButton size="small" color="primary" onClick={() => openView(a)}>
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('common:edit')}>
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
          searchPlaceholder={t('admin:search_title_placeholder')}
          onRowClick={(a) => openEdit(a)}
          filters={
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                select
                size="small"
                label={t('admin:channel_label')}
                value={channel}
                onChange={(e) => {
                  setChannel(e.target.value);
                  setSearchTerm('');
                  setBackendSearch('');
                }}
                sx={{ minWidth: 220 }}
              >
                {getChannelOptions(t).map((opt) => (
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
