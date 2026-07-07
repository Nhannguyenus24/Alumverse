import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminStatusChip from '../../components/admin/AdminStatusChip';
import { useAdminSystemContext } from '../../stores/AdminStore';
import { formatDateTime } from '../../utils/dateFormatter';
import { adminEducationApi } from '../../utils/api';

const getEduFieldLabels = (t) => ({
  program: t('admin:edu_field_program'),
  major: t('admin:edu_field_major'),
  faculty: t('admin:edu_field_faculty'),
  department: t('admin:edu_field_department'),
  startedYear: t('admin:edu_field_started_year'),
  graduatedYear: t('admin:edu_field_graduated_year'),
  graduationStatus: t('admin:edu_field_graduation_status'),
});

const formatEduValue = (key, value, t) => {
  if (key !== 'graduationStatus') return String(value);
  const statusKey = String(value || '').toUpperCase();
  return t(`admin:graduation_status.${statusKey}`, { defaultValue: String(value) });
};

const EduDataSection = ({ title, data, eduFieldLabels, t }) => {
  if (!data) return <Typography variant="body2" color="text.secondary">—</Typography>;
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>{title}</Typography>
      {Object.entries(eduFieldLabels).map(([key, label]) => {
        const values = Array.isArray(data[key]) ? data[key] : [];
        const displayValue = values.length > 0
          ? values.map((value) => formatEduValue(key, value, t)).join(', ')
          : '—';
        return (
          <Box key={key} sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160, flexShrink: 0 }}>
              {label}:
            </Typography>
            <Typography variant="body2">
              {displayValue}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

const AdminEducationRequestsPage = () => {
  const { t } = useTranslation('admin');
  const EDU_FIELD_LABELS = getEduFieldLabels(t);
  const { enqueueSnackbar } = useSnackbar();
  const { stableOrgId } = useAdminSystemContext();
  const { setBreadcrumbs } = useOutletContext();

  const [activeTab, setActiveTab] = useState(0);
  const TAB_STATUSES = [null, 'PENDING', 'APPROVED', 'REJECTED'];

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const [reviewDialog, setReviewDialog] = useState({ open: false, request: null });
  const [reviewForm, setReviewForm] = useState({ decision: 'APPROVED', adminNote: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setBreadcrumbs?.([{ label: t('edu_requests_breadcrumb'), active: true }]);
  }, [setBreadcrumbs]);

  const fetchRequests = async () => {
    if (!stableOrgId) return;
    setLoading(true);
    try {
      const data = await adminEducationApi.getRequests({
        organizationId: stableOrgId,
        status: TAB_STATUSES[activeTab] ?? undefined,
        page,
        size: pageSize,
      });
      setRows(data?.items ?? data?.content ?? []);
      setTotal(data?.totalItem ?? data?.totalElements ?? 0);
    } catch {
      enqueueSnackbar(t('edu_load_error'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableOrgId, activeTab, page]);

  const handleOpenReview = (request) => {
    setReviewForm({ decision: 'APPROVED', adminNote: '' });
    setReviewDialog({ open: true, request });
  };

  const handleCloseReview = () => {
    if (submitting) return;
    setReviewDialog({ open: false, request: null });
  };

  const handleSubmitReview = async () => {
    if (!reviewDialog.request) return;
    setSubmitting(true);
    try {
      await adminEducationApi.reviewRequest(reviewDialog.request.id, reviewForm);
      enqueueSnackbar(
        reviewForm.decision === 'APPROVED' ? t('edu_approved') : t('edu_rejected'),
        { variant: 'success' }
      );
      setReviewDialog({ open: false, request: null });
      fetchRequests();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message ?? t('edu_process_error'), { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      id: 'memberFullName',
      label: t('edu_col_requester'),
      width: 220,
      render: (value, row) => (
        <Box>
          <Typography variant="body2" fontWeight={700}>
            {value || t('event_member_fallback', { id: row.memberId })}
          </Typography>
          {row.memberStudentId ? (
            <Typography variant="caption" color="text.secondary">
              {row.memberStudentId}
            </Typography>
          ) : null}
        </Box>
      ),
    },
    {
      id: 'createdAt',
      label: t('edu_col_sent_date'),
      width: 160,
      render: (value) => formatDateTime(value, '—'),
    },
    {
      id: 'status',
      label: t('col_status'),
      width: 130,
      render: (value) => (
        <AdminStatusChip status={value} category="education" />
      ),
    },
    {
      id: 'actions',
      label: '',
      align: 'right',
      width: 140,
      render: (_, row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            size="small"
            variant="outlined"
            startIcon={row.status === 'PENDING' ? <CheckCircleOutlineIcon /> : <VisibilityOutlinedIcon />}
            onClick={() => handleOpenReview(row)}
          >
            {row.status === 'PENDING' ? t('edu_btn_approve') : t('edu_btn_view')}
          </Button>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" color="primary.main" fontWeight={800}>
          {t('edu_requests_title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75 }}>
          {t('edu_requests_subtitle')}
        </Typography>
      </Box>

      <Tabs value={activeTab} onChange={(_, v) => { setActiveTab(v); setPage(0); }} sx={{ mb: 2 }}>
        <Tab label={t('filter_all')} />
        <Tab label={t('edu_status_pending')} />
        <Tab label={t('edu_status_approved')} />
        <Tab label={t('edu_status_rejected')} />
      </Tabs>

      <AdminDataTable
        columns={columns}
        rows={rows}
        total={total}
        page={page}
        pageSize={pageSize}
        rowsPerPage={pageSize}
        loading={loading}
        onPageChange={setPage}
        emptyMessage={t('edu_empty')}
      />

      <Dialog open={reviewDialog.open} onClose={handleCloseReview} fullWidth maxWidth="md">
        <DialogTitle>
          {reviewDialog.request?.status === 'PENDING' ? t('edu_dialog_review_title') : t('edu_dialog_detail_title')}
        </DialogTitle>
        <DialogContent>
          {reviewDialog.request && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">{t('edu_col_requester')}:</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {reviewDialog.request.memberFullName ?? t('event_member_fallback', { id: reviewDialog.request.memberId })}
                  {reviewDialog.request.memberStudentId ? ` (${reviewDialog.request.memberStudentId})` : ''}
                </Typography>
                <Typography variant="body2" color="text.secondary">{t('edu_col_sent_date')}:</Typography>
                <Typography variant="body2">{formatDateTime(reviewDialog.request.createdAt, '—')}</Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                  <EduDataSection title={t('edu_old_data')} data={reviewDialog.request.oldData} eduFieldLabels={EDU_FIELD_LABELS} t={t} />
                </Box>
                <Box sx={{ border: 1, borderColor: 'primary.main', borderRadius: 1, p: 2, bgcolor: 'primary.lighter' }}>
                  <EduDataSection title={t('edu_new_data')} data={reviewDialog.request.newData} eduFieldLabels={EDU_FIELD_LABELS} t={t} />
                </Box>
              </Box>

              {reviewDialog.request.status === 'PENDING' && (
                <>
                  <TextField
                    select
                    label={t('edu_decision_label')}
                    value={reviewForm.decision}
                    onChange={(e) => setReviewForm((prev) => ({ ...prev, decision: e.target.value }))}
                    fullWidth
                    size="small"
                  >
                    <MenuItem value="APPROVED">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleOutlineIcon color="success" fontSize="small" />
                        {t('edu_btn_approve')}
                      </Box>
                    </MenuItem>
                    <MenuItem value="REJECTED">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CancelOutlinedIcon color="error" fontSize="small" />
                        {t('edu_reject')}
                      </Box>
                    </MenuItem>
                  </TextField>
                  <TextField
                    label={t('edu_admin_note_label')}
                    value={reviewForm.adminNote}
                    onChange={(e) => setReviewForm((prev) => ({ ...prev, adminNote: e.target.value }))}
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                  />
                </>
              )}

              {reviewDialog.request.status !== 'PENDING' && reviewDialog.request.adminNote && (
                <Box sx={{ bgcolor: 'grey.50', border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                  <Typography variant="caption" color="text.secondary">{t('edu_admin_note_prefix')}</Typography>
                  <Typography variant="body2">{reviewDialog.request.adminNote}</Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReview} disabled={submitting}>{t('edu_btn_close')}</Button>
          {reviewDialog.request?.status === 'PENDING' && (
            <Button
              variant="contained"
              color={reviewForm.decision === 'APPROVED' ? 'success' : 'error'}
              onClick={handleSubmitReview}
              disabled={submitting}
            >
              {submitting ? t('processing') : reviewForm.decision === 'APPROVED' ? t('edu_btn_approve') : t('edu_reject')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminEducationRequestsPage;
