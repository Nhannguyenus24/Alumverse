import { useEffect, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Stack,
  alpha,
  useTheme,
  Avatar,
  Tooltip,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
  Chip,
  Divider,
  Slider,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import ZoomInOutlinedIcon from '@mui/icons-material/ZoomInOutlined';
import ZoomOutOutlinedIcon from '@mui/icons-material/ZoomOutOutlined';
import Page from "../../components/Page";
import AdminStatusChip from '../../components/admin/AdminStatusChip';
import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import Iconify from '../../components/Iconify';
import { getVerificationRequests, reopenVerificationRequest, reviewVerificationRequest } from '../../utils/api';
import { formatDateTime } from '../../utils/dateFormatter';
import { useDebounce } from '../../hooks/useDebounce';
import { useAdminSystemContext } from '../../stores/AdminStore';

const getRequestType = (request) => String(request?.requestType || 'PROOF').toUpperCase();
const isPeerRequest = (request) => getRequestType(request) === 'PEER';
const isProofRequest = (request) => getRequestType(request) === 'PROOF';
const isPendingRequest = (request) => String(request?.status || '').toUpperCase() === 'PENDING';
const isImageDocument = (request) => {
  const documentType = String(request?.documentType || '').toLowerCase();
  const documentUrl = String(request?.documentUrl || '');

  return documentType === 'image'
    || /^data:image\//i.test(documentUrl)
    || /\.(?:avif|bmp|gif|jpe?g|png|svg|webp)(?:[?#]|$)/i.test(documentUrl);
};

const parseVerifierList = (value) => String(value || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const AdminVerificationsPage = () => {
  const { t } = useTranslation('admin');
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { setBreadcrumbs } = useOutletContext();
  const { stableOrgId } = useAdminSystemContext();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pendingOnly, setPendingOnly] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearch === searchQuery) return;
    setSearchQuery(debouncedSearch);
    setPage(0);
  }, [debouncedSearch, searchQuery]);

  // Review Dialog State
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [documentViewerRequest, setDocumentViewerRequest] = useState(null);
  const [documentZoom, setDocumentZoom] = useState(1);
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubLoading] = useState(false);

  useEffect(() => {
    setBreadcrumbs?.([{ label: t('nav_verifications'), active: true }]);
  }, [setBreadcrumbs]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getVerificationRequests(pendingOnly, page, rowsPerPage, searchQuery, stableOrgId || null);
      const data = res?.data?.data || {};
      setRequests(data.items || []);
      setTotalCount(data.totalElements || data.totalItem || data.totalItems || 0);
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || t('verif_error_load'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRequests();
  }, [page, rowsPerPage, pendingOnly, searchQuery, stableOrgId]);

  const handleReview = (request) => {
    setSelectedRequest(request);
    setAdminNote(request.adminNote || '');
    setReviewDialogOpen(true);
  };

  const handleOpenDocument = (request, event) => {
    event?.stopPropagation();
    if (request?.documentUrl) {
      setDocumentZoom(1);
      setDocumentViewerRequest(request);
    }
  };

  const submitReview = async (request, status, note = '') => {
    if (!request) return;
    setSubLoading(true);
    try {
      // Send uppercase status to match backend @Pattern validation
      const finalStatus = status.toUpperCase();
      await reviewVerificationRequest(request.id, finalStatus, note);
      enqueueSnackbar(finalStatus === 'APPROVED' ? t('verif_approved_success') : t('verif_rejected_success'), { variant: 'success' });
      setReviewDialogOpen(false);
      void fetchRequests();
    } catch (error) {
      console.error('Review submission error:', error);
      enqueueSnackbar(error?.response?.data?.message || t('verif_error_review'), { variant: 'error' });
    } finally {
      setSubLoading(false);
    }
  };

  const submitReopen = async (request, note = '') => {
    if (!request) return;
    setSubLoading(true);
    try {
      await reopenVerificationRequest(request.id, getRequestType(request), note);
      enqueueSnackbar(t('verif_reopen_success'), { variant: 'success' });
      setReviewDialogOpen(false);
      void fetchRequests();
    } catch (error) {
      console.error('Reopen verification request error:', error);
      enqueueSnackbar(error?.response?.data?.message || t('verif_error_reopen'), { variant: 'error' });
    } finally {
      setSubLoading(false);
    }
  };

  const renderRequestType = (request) => (
    <Stack direction="row" spacing={1} alignItems="center">
      {isPeerRequest(request) ? (
        <Iconify icon="mdi:account-group-check-outline" width={20} height={20} color={theme.palette.info.main} />
      ) : (
        <DescriptionOutlinedIcon fontSize="small" color="action" />
      )}
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {isPeerRequest(request) ? t('verif_type_peer') : t('verif_type_proof')}
        </Typography>
        {isProofRequest(request) && request.documentType && (
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
            {request.documentType}
          </Typography>
        )}
      </Box>
    </Stack>
  );

  const renderEvidence = (request) => {
    if (isPeerRequest(request)) {
      const confirmed = parseVerifierList(request.confirmedVerifiers);
      const pending = parseVerifierList(request.pendingVerifiers);
      const fallback = parseVerifierList(request.evidenceSummary);
      const statusTagSx = {
        height: 22,
        borderColor: alpha(theme.palette.text.secondary, 0.18),
        bgcolor: alpha(theme.palette.text.secondary, 0.06),
        color: 'text.secondary',
        fontWeight: 700,
      };
      return (
        <Stack spacing={0.75} sx={{ minWidth: 220 }}>
          {confirmed.map((name) => (
            <Stack key={`ok-${name}`} direction="row" spacing={0.75} alignItems="center">
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {name}
              </Typography>
              <Chip size="small" variant="outlined" label={t('verif_peer_confirmed')} sx={statusTagSx} />
            </Stack>
          ))}
          {pending.map((name) => (
            <Stack key={`pending-${name}`} direction="row" spacing={0.75} alignItems="center">
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {name}
              </Typography>
              <Chip size="small" variant="outlined" label={t('verif_peer_pending')} sx={statusTagSx} />
            </Stack>
          ))}
          {confirmed.length === 0 && pending.length === 0 && fallback.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              {fallback.join(', ')}
            </Typography>
          )}
        </Stack>
      );
    }

    if (!request.documentUrl) {
      return <Typography variant="body2" color="text.secondary">-</Typography>;
    }

    return (
      <Link
        component="button"
        type="button"
        sx={{
          p: 0,
          border: 0,
          bgcolor: 'transparent',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
        }}
        onClick={(event) => handleOpenDocument(request, event)}
      >
        {t('verif_view_document')}
      </Link>
    );
  };

  const columns = useMemo(() => [
    {
      id: 'user',
      label: t('verif_col_user'),
      render: (_, r) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar 
            src={r.avatarUrl} 
            sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontSize: 13, fontWeight: 700 }}
          >
            {(r.fullName || r.studentId || '?')[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {r.fullName || r.studentId}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {r.email}
            </Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'requestType',
      label: t('verif_col_doc_type'),
      render: (_, r) => renderRequestType(r)
    },
    {
      id: 'documentUrl',
      label: t('verif_col_document'),
      render: (_, r) => renderEvidence(r)
    },
    {
      id: 'status',
      label: t('col_status'),
      render: (val) => (
        <AdminStatusChip status={val} category="account" />
      )
    },
    { id: 'createdAt', label: t('verif_col_submitted_at'), render: (val) => formatDateTime(val) },
    {
      id: 'actions',
      label: t('actions'),
      align: 'right',
      width: 130,
      render: (_, r) => {
        const isPending = isPendingRequest(r);
        return (
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            <Tooltip title={t('tooltip_view_detail')}>
              <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleReview(r); }}>
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {isPending && isProofRequest(r) && (
              <Tooltip title={t('verif_quick_approve')}>
                <IconButton 
                  size="small" 
                  color="success" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    submitReview(r, 'APPROVED'); 
                  }}
                >
                  <CheckCircleOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {isPending && (
              <Tooltip title={t('verif_reopen_form')}>
                <IconButton
                  size="small"
                  color="warning"
                  onClick={(e) => {
                    e.stopPropagation();
                    submitReopen(r);
                  }}
                >
                  <RestartAltOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        );
      }
    }
  ], [theme, handleReview, submitReview]);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
          {t('verif_page_title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
          {t('verif_page_subtitle')}
        </Typography>
      </Box>

      <AdminDataTable
        columns={columns}
        rows={requests}
        totalCount={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, next) => setPage(next)}
        onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
        onSearchChange={setSearchTerm} 
        searchValue={searchTerm}
        searchPlaceholder={t('verif_search_placeholder')}
        onRowClick={handleReview}
        filters={
          <TextField
            select
            size="small"
            label={t('verif_filter_label')}
            value={pendingOnly ? 'pending' : 'all'}
            onChange={(e) => { setPendingOnly(e.target.value === 'pending'); setPage(0); }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="pending">{t('verif_filter_pending')}</MenuItem>
            <MenuItem value="all">{t('filter_all')}</MenuItem>
          </TextField>
        }
        loading={loading}
      />

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => !submitting && setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{t('verif_dialog_title')}</DialogTitle>
        <DialogContent dividers>
          {selectedRequest && (
            <Stack spacing={2.5} sx={{ py: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  {t('verif_dialog_sender')}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {selectedRequest.fullName || selectedRequest.studentId} ({selectedRequest.email})
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  {t('verif_col_doc_type')}
                </Typography>
                {renderRequestType(selectedRequest)}
              </Box>

              <Divider />

              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  {isPeerRequest(selectedRequest) ? t('verif_dialog_peer_evidence') : t('verif_dialog_document')}
                </Typography>
                {isPeerRequest(selectedRequest) ? (
                  renderEvidence(selectedRequest)
                ) : (
                  <Button
                    variant="contained"
                    disabled={!selectedRequest.documentUrl}
                    startIcon={<DescriptionOutlinedIcon />}
                    onClick={() => handleOpenDocument(selectedRequest)}
                  >
                    {t('verif_open_document')}
                  </Button>
                )}
              </Box>

              {selectedRequest.aiSummary && (
                <Box sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.08), borderRadius: 2, border: `1px dashed ${theme.palette.info.main}` }}>
                  <Typography variant="caption" sx={{ color: 'info.main', fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Iconify icon="fluent:bot-24-filled" /> {t('verif_ai_summary')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                    {selectedRequest.aiSummary}
                  </Typography>
                </Box>
              )}

              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  {t('verif_admin_note_label')}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder={t('verif_admin_note_placeholder')}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button 
            variant="outlined"
            disabled={submitting} 
            onClick={() => setReviewDialogOpen(false)} 
            color="secondary"
          >
            {t('verif_btn_close')}
          </Button>
          {isPendingRequest(selectedRequest) && (
            <>
              <Button
                variant="contained"
                color="warning"
                disabled={submitting}
                startIcon={<RestartAltOutlinedIcon />}
                onClick={() => submitReopen(selectedRequest, adminNote)}
              >
                {t('verif_reopen_form')}
              </Button>
              {isProofRequest(selectedRequest) && (
                <>
                  <Button
                    variant="contained"
                    color="error"
                    disabled={submitting}
                    startIcon={<HighlightOffIcon />}
                    onClick={() => submitReview(selectedRequest, 'REJECTED', adminNote)}
                  >
                    {t('verif_btn_reject')}
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    disabled={submitting}
                    startIcon={<CheckCircleOutlineIcon />}
                    onClick={() => submitReview(selectedRequest, 'APPROVED', adminNote)}
                  >
                    {t('verif_btn_approve')}
                  </Button>
                </>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Supporting document viewer */}
      <Dialog
        open={Boolean(documentViewerRequest)}
        onClose={() => setDocumentViewerRequest(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <span>{t('verif_dialog_document')}</span>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: { xs: '100%', sm: 280 } }}>
            <Tooltip title={t('verif_zoom_out', { defaultValue: 'Thu nhỏ' })}>
              <span>
                <IconButton
                  size="small"
                  onClick={() => setDocumentZoom((value) => Math.max(0.5, Number((value - 0.25).toFixed(2))))}
                  disabled={documentZoom <= 0.5}
                >
                  <ZoomOutOutlinedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Slider
              size="small"
              min={0.5}
              max={2.5}
              step={0.25}
              value={documentZoom}
              onChange={(_, value) => setDocumentZoom(value)}
              aria-label={t('verif_zoom_level', { defaultValue: 'Zoom' })}
              sx={{ flex: 1 }}
            />
            <Tooltip title={t('verif_zoom_in', { defaultValue: 'Phóng to' })}>
              <span>
                <IconButton
                  size="small"
                  onClick={() => setDocumentZoom((value) => Math.min(2.5, Number((value + 0.25).toFixed(2))))}
                  disabled={documentZoom >= 2.5}
                >
                  <ZoomInOutlinedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            height: { xs: '70vh', md: '78vh' },
            p: 0,
            overflow: 'auto',
            bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.08 : 0.04),
          }}
        >
          {documentViewerRequest && (
            isImageDocument(documentViewerRequest) ? (
              <Box sx={{ minWidth: `${documentZoom * 100}%`, minHeight: `${documentZoom * 100}%`, p: 2 }}>
                <Box
                  component="img"
                  src={documentViewerRequest.documentUrl}
                  alt={t('verif_dialog_document')}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: documentZoom === 1 ? 'calc(78vh - 32px)' : 'none',
                    objectFit: 'contain',
                    display: 'block',
                    mx: 'auto',
                  }}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  width: `${100 / documentZoom}%`,
                  height: `${100 / documentZoom}%`,
                  minHeight: `${78 / documentZoom}vh`,
                  transform: `scale(${documentZoom})`,
                  transformOrigin: 'top left',
                }}
              >
                <Box
                  component="iframe"
                  src={documentViewerRequest.documentUrl}
                  title={t('verif_dialog_document')}
                  sx={{ width: '100%', height: '100%', minHeight: '78vh', border: 0, display: 'block', bgcolor: 'background.paper' }}
                />
              </Box>
            )
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDocumentZoom(1)}>
            {t('verif_zoom_reset', { defaultValue: 'Về 100%' })}
          </Button>
          {documentViewerRequest?.documentUrl && (
            <Button
              component="a"
              href={documentViewerRequest.documentUrl}
              target="_blank"
              rel="noreferrer"
              startIcon={<OpenInNewOutlinedIcon />}
            >
              {t('verif_open_new_tab', { defaultValue: 'Mở tab mới' })}
            </Button>
          )}
          <Button variant="outlined" color="secondary" onClick={() => setDocumentViewerRequest(null)}>
            {t('verif_btn_close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminVerificationsPage;
