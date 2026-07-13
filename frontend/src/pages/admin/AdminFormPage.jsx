import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Box, Typography, Chip, IconButton, Tooltip, Button, TextField, MenuItem, Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import PollOutlinedIcon from '@mui/icons-material/PollOutlined';
import { useTranslation } from 'react-i18next';
import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminDashboardMetricTile from '../../components/admin/AdminDashboardMetricTile';
import AdminSurveyBuilderDialog from '../../components/admin/AdminSurveyBuilderDialog';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import { surveyApi } from '../../utils/api';
import { useNotification } from '../../hooks/useNotification';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDateTime } from '../../utils/dateFormatter';
import { SURVEY_STATUS } from '../../constants/surveyQuestionTypes';

const statusColor = (status) => {
  switch (status) {
    case SURVEY_STATUS.OPEN: return 'success';
    case SURVEY_STATUS.CLOSED: return 'default';
    default: return 'warning';
  }
};

const AdminFormPage = () => {
  const { t } = useTranslation(['survey', 'common', 'admin']);
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const debouncedSearch = useDebounce(search, 400);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: pageSize };
      if (debouncedSearch) params.keyword = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      const data = await surveyApi.listAdminSurveys(params);
      setRows(data?.items || []);
      setTotal(data?.totalItem ?? 0);
    } catch (e) {
      showError(e?.response?.data?.message || t('common:error_occurred'));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, statusFilter, showError, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const metrics = useMemo(() => {
    const open = rows.filter((r) => r.effectiveStatus === SURVEY_STATUS.OPEN).length;
    const closed = rows.filter((r) => r.effectiveStatus === SURVEY_STATUS.CLOSED).length;
    const draft = rows.filter((r) => r.status === SURVEY_STATUS.DRAFT).length;
    return { open, closed, draft };
  }, [rows]);

  const openBuilder = (survey = null) => { setEditingSurvey(survey); setBuilderOpen(true); };

  const handleOpenSurvey = async (id) => {
    try {
      await surveyApi.openSurvey(id);
      showSuccess(t('survey:opened_success'));
      fetchData();
    } catch (e) { showError(e?.response?.data?.message || t('common:error_occurred')); }
  };

  const handleCloseSurvey = async (id) => {
    try {
      await surveyApi.closeSurvey(id);
      showSuccess(t('survey:closed_success'));
      fetchData();
    } catch (e) { showError(e?.response?.data?.message || t('common:error_occurred')); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await surveyApi.deleteSurvey(deleteTarget.id);
      showSuccess(t('survey:deleted_success'));
      setDeleteTarget(null);
      fetchData();
    } catch (e) { showError(e?.response?.data?.message || t('common:error_occurred')); }
  };

  const columns = useMemo(() => [
    { id: 'title', label: t('survey:col_title'), render: (v, row) => (
      <Box>
        <Typography variant="body2" fontWeight={600}>{row.title}</Typography>
        <Typography variant="caption" color="text.secondary">
          {(row.questions?.length ?? 0)} {t('survey:questions_count')}
        </Typography>
      </Box>
    ) },
    { id: 'effectiveStatus', label: t('survey:col_status'), align: 'center', render: (v, row) => (
      <Chip size="small" color={statusColor(row.effectiveStatus)}
        label={t(`survey:status_${(row.effectiveStatus || 'DRAFT').toLowerCase()}`)} />
    ) },
    { id: 'startAt', label: t('survey:col_start'), render: (v) => (v ? formatDateTime(v) : '—') },
    { id: 'endAt', label: t('survey:col_end'), render: (v) => (v ? formatDateTime(v) : '—') },
    { id: 'submissionCount', label: t('survey:col_responses'), align: 'center',
      render: (v) => <Chip size="small" variant="outlined" label={v ?? 0} /> },
    { id: 'actions', label: t('common:actions'), align: 'right', render: (v, row) => {
      const isDraft = row.status === SURVEY_STATUS.DRAFT;
      const isOpen = row.effectiveStatus === SURVEY_STATUS.OPEN;
      return (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title={t('survey:view_results')}>
            <IconButton size="small" onClick={() => navigate(`${row.id}/results`)}>
              <BarChartOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {isDraft && (
            <Tooltip title={t('common:edit')}>
              <IconButton size="small" onClick={() => openBuilder(row)}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {isOpen ? (
            <Tooltip title={t('survey:close')}>
              <IconButton size="small" color="warning" onClick={() => handleCloseSurvey(row.id)}>
                <StopIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title={row.status === SURVEY_STATUS.CLOSED ? t('survey:reopen') : t('survey:open')}>
              <IconButton size="small" color="success" onClick={() => handleOpenSurvey(row.id)}>
                <PlayArrowIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={t('common:delete')}>
            <IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      );
    } },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, navigate]);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>{t('survey:page_title')}</Typography>
        <Typography variant="body2" color="text.secondary">{t('survey:page_subtitle')}</Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <AdminDashboardMetricTile label={t('survey:metric_open')} value={metrics.open}
            icon={<PollOutlinedIcon />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <AdminDashboardMetricTile label={t('survey:metric_draft')} value={metrics.draft} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <AdminDashboardMetricTile label={t('survey:metric_closed')} value={metrics.closed} />
        </Grid>
      </Grid>

      <AdminDataTable
        columns={columns}
        rows={rows}
        totalCount={total}
        page={page}
        rowsPerPage={pageSize}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        onRowsPerPageChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(0); }}
        searchValue={search}
        onSearchChange={(e) => { setSearch(e.target.value); setPage(0); }}
        searchPlaceholder={t('survey:search_placeholder')}
        filters={(
          <TextField
            select size="small" value={statusFilter} label={t('survey:col_status')}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">{t('common:all')}</MenuItem>
            <MenuItem value={SURVEY_STATUS.DRAFT}>{t('survey:status_draft')}</MenuItem>
            <MenuItem value={SURVEY_STATUS.OPEN}>{t('survey:status_open')}</MenuItem>
            <MenuItem value={SURVEY_STATUS.CLOSED}>{t('survey:status_closed')}</MenuItem>
          </TextField>
        )}
        addButton={(
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openBuilder(null)}>
            {t('survey:create_survey')}
          </Button>
        )}
      />

      <AdminSurveyBuilderDialog
        open={builderOpen}
        survey={editingSurvey}
        onClose={() => setBuilderOpen(false)}
        onSaved={fetchData}
      />

      <AdminConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('survey:delete_title')}
        description={t('survey:delete_confirm', { title: deleteTarget?.title || '' })}
      />
    </Box>
  );
};

export default AdminFormPage;
