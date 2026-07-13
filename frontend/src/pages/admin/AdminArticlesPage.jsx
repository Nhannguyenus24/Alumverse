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
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '../../hooks/useDebounce';
import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import AdminStatusChip from '../../components/admin/AdminStatusChip';
import useAdminArticles from '../../hooks/admin/useAdminArticles';
import { useAdminSystemContext } from '../../stores/AdminStore';
import { useOrgNavigate, useOrgPath } from '../../hooks/useOrgNavigate';
import { formatDateTime } from '../../utils/dateFormatter';
import apiClient from '../../utils/axios';
import {
  canToggleArticleVisibility,
  deleteArticleByChannel,
  getArticleVisibilityState,
  toggleArticleVisibility,
} from '../../utils/articleAdminActions';
import {
  getAdminArticleChannelLabel,
  getAdminArticleChannelOptions,
  getAdminArticleCreateChannelOptions,
} from '../../constants/adminArticleChannels';

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
const visibilityStatusOf = (article) => {
  const state = getArticleVisibilityState(article);
  if (state === 'published') return 'PUBLISHED';
  if (state === 'rejected') return 'REJECTED';
  if (state === 'hidden') return 'HIDDEN';
  return 'UNSUPPORTED';
};

const ActionSlot = ({ children }) => (
  <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    {children}
  </Box>
);

const AdminArticlesPage = () => {
  const { t } = useTranslation(['admin', 'common']);
  const { setBreadcrumbs } = useOutletContext();
  const navigate = useOrgNavigate();
  const toOrgPath = useOrgPath();
  const { enqueueSnackbar } = useSnackbar();
  const { stableOrgId } = useAdminSystemContext();
  const {
    channel, setChannel,
    articles, totalItems, loading,
    page, setPage,
    rowsPerPage, setRowsPerPage,
    search: backendSearch, setSearch: setBackendSearch,
    sortOrder, setSortOrder,
    refresh,
  } = useAdminArticles('all', stableOrgId);

  const [searchTerm, setSearchTerm] = useState(backendSearch);
  const [createAnchorEl, setCreateAnchorEl] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [visibilityBusyId, setVisibilityBusyId] = useState(null);
  const debouncedSearch = useDebounce(searchTerm, 500);
  const channelOptions = getAdminArticleChannelOptions(t);
  const createChannelOptions = getAdminArticleCreateChannelOptions(t);

  useEffect(() => {
    if (debouncedSearch === backendSearch) return;
    setBackendSearch(debouncedSearch);
    setPage(0);
  }, [debouncedSearch, backendSearch, setBackendSearch, setPage]);

  useEffect(() => {
    setBreadcrumbs?.([{ label: t('admin:articles'), active: true }]);
  }, [setBreadcrumbs, t]);

  const openInNewTab = (path) => {
    window.open(toOrgPath(path), '_blank', 'noopener,noreferrer');
  };

  const openEdit = (a) => openInNewTab(`/admin/article/${channelOf(a, channel)}/${idOf(a)}/edit`);
  const openView = (a) => openInNewTab(`/article/${channelOf(a, channel)}/${idOf(a)}`);
  const openDeleteDialog = (a) => setDeleteTarget({ ...a, channel: channelOf(a, channel) });
  const closeDeleteDialog = () => {
    if (!deleting) setDeleteTarget(null);
  };
  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteArticleByChannel(apiClient, deleteTarget);
      enqueueSnackbar(t('admin:article_delete_success'), { variant: 'success' });
      setDeleteTarget(null);
      refresh();
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || t('admin:article_delete_failed'), { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };
  const handleCreateArticle = (itemChannel) => {
    setCreateAnchorEl(null);
    navigate(`/post/${itemChannel}`);
  };
  const handleToggleVisibility = async (article) => {
    if (!canToggleArticleVisibility(article)) return;
    const busyId = `${channelOf(article, channel)}-${idOf(article)}`;
    setVisibilityBusyId(busyId);
    try {
      await toggleArticleVisibility(apiClient, { ...article, channel: channelOf(article, channel) });
      const messageKey = getArticleVisibilityState(article) === 'published'
        ? 'admin:article_unpublish_success'
        : 'admin:article_publish_success';
      enqueueSnackbar(t(messageKey), { variant: 'success' });
      refresh();
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || t('admin:article_visibility_update_failed'), { variant: 'error' });
    } finally {
      setVisibilityBusyId(null);
    }
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
            {t('admin:article_management_title')}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: 500 }}
          >
            {t('admin:article_management_desc')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          onClick={(event) => setCreateAnchorEl(event.currentTarget)}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {t('admin:create_article')}
        </Button>
        <Menu
          anchorEl={createAnchorEl}
          open={Boolean(createAnchorEl)}
          onClose={() => setCreateAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {createChannelOptions.map((item) => (
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
              label: t('admin:col_title'),
              render: (_, a) => (
                <Typography variant="body2" noWrap sx={{ maxWidth: 360 }}>
                  {titleOf(a)}
                </Typography>
              ),
            },
            {
              id: "channel",
              label: t('admin:col_channel_type'),
              render: (value, a) => (
                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  label={getAdminArticleChannelLabel(t, value || channelOf(a, channel))}
                  sx={{ fontWeight: 700 }}
                />
              ),
            },
            {
              id: "createdAt",
              label: t('admin:col_created_at'),
              render: (_, a) => formatDateTime(createdOf(a)),
            },
            {
              id: "visibility",
              label: t('admin:col_status'),
              render: (_, a) => (
                <AdminStatusChip
                  status={visibilityStatusOf(a)}
                  category="article"
                  variant={getArticleVisibilityState(a) === 'published' ? 'filled' : 'outlined'}
                />
              ),
            },
            {
              id: "actions",
              label: t('admin:col_actions'),
              align: "right",
              render: (_, a) => (
                <Box
                  sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, width: 172, ml: 'auto' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ActionSlot>
                    <Tooltip title={t('admin:view_public_page')}>
                      <IconButton size="small" sx={{ color: 'primary.main' }} onClick={() => openView(a)}>
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ActionSlot>
                  <ActionSlot>
                    {(a.url || a.linkUrl) && (
                    <Tooltip title={t('admin:view_original_link')}>
                      <IconButton
                        size="small"
                        sx={{ color: 'info.main' }}
                        onClick={() => window.open(a.url || a.linkUrl, '_blank', 'noopener,noreferrer')}
                      >
                        <LinkIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    )}
                  </ActionSlot>
                  <ActionSlot>
                    <Tooltip title={t('admin:tooltip_edit')}>
                      <IconButton size="small" sx={{ color: 'secondary.main' }} onClick={() => openEdit(a)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ActionSlot>
                  <ActionSlot>
                    {canToggleArticleVisibility(a) && (
                    <Tooltip title={getArticleVisibilityState(a) === 'published' ? t('admin:tooltip_unpublish_article') : t('admin:tooltip_publish_article')}>
                      <span>
                        <IconButton
                          size="small"
                          sx={{ color: getArticleVisibilityState(a) === 'published' ? 'warning.main' : 'success.main' }}
                          disabled={visibilityBusyId === `${channelOf(a, channel)}-${idOf(a)}`}
                          onClick={() => handleToggleVisibility(a)}
                        >
                          {getArticleVisibilityState(a) === 'published'
                            ? <CancelOutlinedIcon fontSize="small" />
                            : <CheckCircleOutlineIcon fontSize="small" />}
                        </IconButton>
                      </span>
                    </Tooltip>
                    )}
                  </ActionSlot>
                  <ActionSlot>
                    <Tooltip title={t('admin:tooltip_delete')}>
                      <IconButton size="small" sx={{ color: 'error.main' }} onClick={() => openDeleteDialog(a)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ActionSlot>
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
                {channelOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label={t('admin:filter_sort_label')}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="DESC">{t('admin:sort_newest')}</MenuItem>
                <MenuItem value="ASC">{t('admin:sort_oldest')}</MenuItem>
              </TextField>
            </Stack>
          }
        />
      )}
      <AdminConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title={t('admin:article_delete_title')}
        description={t('admin:article_delete_desc', { title: titleOf(deleteTarget ?? {}) })}
        onClose={closeDeleteDialog}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        confirmLabel={t('admin:delete')}
        titleColor="error.main"
        confirmColor="error"
      />
    </Box>
  );
};

export default AdminArticlesPage;
