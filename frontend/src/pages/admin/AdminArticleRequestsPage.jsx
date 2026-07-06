import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import AdminStatusChip from '../../components/admin/AdminStatusChip';
import useAdminArticles from '../../hooks/admin/useAdminArticles';
import { useAdminSystemContext } from '../../stores/AdminStore';
import { useOrgPath } from '../../hooks/useOrgNavigate';
import { formatDateTime } from '../../utils/dateFormatter';
import apiClient from '../../utils/axios';
import {
  canToggleArticleVisibility,
  deleteArticleByChannel,
  getArticleVisibilityState,
  toggleArticleVisibility,
} from '../../utils/articleAdminActions';

const titleOf = (a) => a.title || a.name || a.position || '-';
const idOf = (a) => a.id;
const createdOf = (a) => a.createdAt || a.created_at || a.publishedAt || a.awardedDate || a.deadline;
const channelLabelOf = (value, t) => ({
  news: t('channel_news'),
  alumni: t('channel_alumni'),
  achievement: t('channel_achievement'),
  job: t('channel_job'),
  learning: t('channel_learning'),
}[value] ?? value ?? '-');

const isPendingRequest = (article) => {
  const state = getArticleVisibilityState(article);
  if (article.channel === 'learning') return false;
  return state === 'hidden' || state === 'rejected';
};

const statusOf = (article) => (getArticleVisibilityState(article) === 'rejected' ? 'REJECTED' : 'PENDING');

const AdminArticleRequestsPage = () => {
  const { setBreadcrumbs } = useOutletContext();
  const { t } = useTranslation('admin');
  const toOrgPath = useOrgPath();
  const { enqueueSnackbar } = useSnackbar();
  const { stableOrgId } = useAdminSystemContext();
  const {
    articles,
    loading,
    setPage: setSourcePage,
    setRowsPerPage: setSourceRowsPerPage,
    search,
    setSearch,
    refresh,
  } = useAdminArticles('all', stableOrgId);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [approvingId, setApprovingId] = useState(null);

  useEffect(() => {
    setBreadcrumbs?.([{ label: t('nav_submissions'), active: true }]);
  }, [setBreadcrumbs, t]);

  useEffect(() => {
    setSourcePage(0);
    setSourceRowsPerPage(1000);
  }, [setSourcePage, setSourceRowsPerPage]);

  const requestRows = useMemo(() => articles.filter(isPendingRequest), [articles]);
  const visibleRows = useMemo(() => {
    const start = page * rowsPerPage;
    return requestRows.slice(start, start + rowsPerPage);
  }, [page, requestRows, rowsPerPage]);

  const openInNewTab = (path) => {
    window.open(toOrgPath(path), '_blank', 'noopener,noreferrer');
  };

  const openEdit = (a) => openInNewTab(`/admin/article/${a.channel}/${idOf(a)}/edit`);
  const openView = (a) => openInNewTab(`/article/${a.channel}/${idOf(a)}`);

  const handleApprove = async (article) => {
    if (!canToggleArticleVisibility(article)) return;
    const busyId = `${article.channel}-${idOf(article)}`;
    setApprovingId(busyId);
    try {
      await toggleArticleVisibility(apiClient, article);
      enqueueSnackbar(t('submissions_approve_success'), { variant: 'success' });
      refresh();
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || t('submissions_approve_failed'), { variant: 'error' });
    } finally {
      setApprovingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteArticleByChannel(apiClient, deleteTarget);
      enqueueSnackbar(t('submissions_delete_success'), { variant: 'success' });
      setDeleteTarget(null);
      refresh();
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || t('submissions_delete_failed'), { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
          {t('nav_submissions')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
          {t('submissions_desc')}
        </Typography>
      </Box>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress size={28} /></Stack>
      ) : (
        <AdminDataTable
          columns={[
            { id: 'id', label: 'ID', render: (_, a) => idOf(a) },
            {
              id: 'title',
              label: t('col_title'),
              render: (_, a) => (
                <Typography variant="body2" noWrap sx={{ maxWidth: 360 }}>
                  {titleOf(a)}
                </Typography>
              ),
            },
            {
              id: 'channel',
              label: t('channel_label'),
              render: (value, a) => (
                <Chip size="small" color="primary" variant="outlined" label={channelLabelOf(value || a.channel, t)} sx={{ fontWeight: 700 }} />
              ),
            },
            {
              id: 'status',
              label: t('col_status'),
              render: (_, a) => (
                <AdminStatusChip
                  status={statusOf(a)}
                  category="article"
                  variant="outlined"
                />
              ),
            },
            { id: 'createdAt', label: t('col_submitted_at'), render: (_, a) => formatDateTime(createdOf(a)) },
            {
              id: 'actions',
              label: t('col_actions'),
              align: 'right',
              render: (_, a) => (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                  <Tooltip title={t('view_public_page')}>
                    <IconButton size="small" sx={{ color: 'primary.main' }} onClick={() => openView(a)}>
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('action_edit')}>
                    <IconButton size="small" sx={{ color: 'secondary.main' }} onClick={() => openEdit(a)}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('action_publish')}>
                    <span>
                      <IconButton
                        size="small"
                        sx={{ color: 'success.main' }}
                        disabled={approvingId === `${a.channel}-${idOf(a)}`}
                        onClick={() => handleApprove(a)}
                      >
                        <CheckCircleOutlineIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={t('action_delete_reject')}>
                    <IconButton size="small" sx={{ color: 'error.main' }} onClick={() => setDeleteTarget(a)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ),
            },
          ]}
          rows={visibleRows}
          getRowId={(row, idx) => `${row.channel}-${idOf(row) ?? idx}`}
          totalCount={requestRows.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(0);
          }}
          searchValue={search}
          searchPlaceholder={t('submissions_search_placeholder')}
          onRowClick={openEdit}
        />
      )}

      <AdminConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title={t('submissions_delete_title')}
        description={t('submissions_delete_desc', { title: titleOf(deleteTarget ?? {}) })}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        confirmLabel={t('action_delete')}
        titleColor="error.main"
        confirmColor="error"
      />
    </Box>
  );
};

export default AdminArticleRequestsPage;
