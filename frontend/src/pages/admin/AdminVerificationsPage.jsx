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
  Tab,
  Tabs,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import ZoomInOutlinedIcon from '@mui/icons-material/ZoomInOutlined';
import ZoomOutOutlinedIcon from '@mui/icons-material/ZoomOutOutlined';
import Page from "../../components/Page";
import AdminStatusChip from '../../components/admin/AdminStatusChip';
import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import ActionOverlay from '../../components/ActionOverlay';
import Iconify from '../../components/Iconify';
import {
  getTrustedVerifiers,
  getUserById,
  getUsers,
  getVerificationRequests,
  reopenVerificationRequest,
  reviewVerificationRequest,
  updateTrustedVerifier,
} from '../../utils/api';
import { formatDateTime } from '../../utils/dateFormatter';
import { useDebounce } from '../../hooks/useDebounce';
import { VERIFICATION_OCR_READY_EVENT } from '../../hooks/useServerSentEvents';
import { useAdminSystemContext } from '../../stores/AdminStore';

/** Tab thứ ba không phải một loại yêu cầu — nó liệt kê người được tin cậy để xác thực chéo. */
const TRUSTED_TAB = 'TRUSTED';

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

/** Màu của panel gợi ý theo mức khuyến nghị. */
const VERDICT_TONE = { pending: 'info', reject: 'error', review: 'warning', approve: 'success' };

/** Các cột này về từ jsonb nên có thể là mảng thật, chuỗi JSON, hoặc chuỗi thường. */
const formatJsonList = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value)) return value.filter(Boolean).join(', ') || '-';
  const raw = String(value).trim();
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).join(', ') || '-';
    } catch {
      // Không phải JSON hợp lệ thì hiển thị nguyên văn bên dưới.
    }
  }
  return raw || '-';
};

const FIELD_LABEL_KEYS = {
  program: 'edu_field_program',
  major: 'edu_field_major',
  faculty: 'edu_field_faculty',
  startedYear: 'edu_field_started_year',
};

/** Chữ OCR ngắn hơn mức này thì gần như chắc chắn ảnh mờ / không đọc được. */
const MIN_READABLE_OCR_LENGTH = 25;

const stripDiacritics = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase();

/** MSSV HCMUS mở đầu bằng 2 số của năm nhập học: 22127294 -> khoá 2022. */
const cohortFromStudentId = (studentId) => {
  const matched = String(studentId || '').match(/^(\d{2})\d{4,}$/);
  return matched ? 2000 + Number(matched[1]) : null;
};

/**
 * Đối chiếu chữ đọc từ tài liệu với thông tin người dùng tự khai.
 * Thuần tính toán, không gọi AI: các kiểm tra ở đây đều là so khớp chính xác.
 * @returns danh sách {code, severity, params} để phía render dịch sang câu chữ.
 */
const buildDocumentFindings = ({ ocrText, studentId, fullName, entry }) => {
  const findings = [];

  // Đọc tài liệu chạy nền, mất khoảng nửa phút sau khi người dùng gửi. Trong lúc đó chưa có
  // chữ nào để đối chiếu — khác hẳn với việc đọc ra rác, nên không được kết luận gì.
  if (ocrText === null || ocrText === undefined || String(ocrText).trim() === '') {
    return [{ code: 'processing', severity: 'pending' }];
  }

  const ocr = String(ocrText).trim();

  if (ocr.length < MIN_READABLE_OCR_LENGTH) {
    findings.push({ code: 'unreadable', severity: 'warning' });
    return findings; // Không đọc được chữ thì mọi so khớp bên dưới đều vô nghĩa.
  }

  const ocrPlain = stripDiacritics(ocr);

  if (studentId) {
    if (!ocrPlain.includes(String(studentId).toLowerCase())) {
      const onDoc = ocr.match(/\b\d{8,}\b/);
      findings.push({
        code: onDoc ? 'student_id_differs' : 'student_id_missing',
        severity: 'warning',
        params: { declared: studentId, onDocument: onDoc ? onDoc[0] : undefined },
      });
    }

    const cohort = cohortFromStudentId(studentId);
    const startedYear = entry?.startedYear ? Number(entry.startedYear) : null;
    if (cohort && startedYear && cohort !== startedYear) {
      findings.push({
        code: 'cohort_mismatch',
        severity: 'warning',
        params: { studentId, cohort, startedYear },
      });
    }
  }

  if (fullName) {
    const namePlain = stripDiacritics(fullName);
    if (namePlain && !ocrPlain.includes(namePlain)) {
      findings.push({ code: 'name_not_found', severity: 'warning', params: { declared: fullName } });
    }
  }

  const missing = ['program', 'major', 'faculty', 'startedYear']
    .filter((field) => !entry?.[field]);
  if (missing.length > 0) {
    findings.push({ code: 'missing_fields', severity: 'info', params: { fields: missing } });
  }

  return findings;
};

// Older rows store the Vietnamese label instead of the enum, so map both onto the enum key.
const normalizeGraduationStatus = (value) => {
  if (!value) return '';
  const raw = String(value).trim();
  const upper = raw.toUpperCase();
  if (upper === 'STUDYING' || upper.includes('ĐANG') || upper.includes('DANG')) return 'STUDYING';
  if (upper === 'GRADUATED' || upper.includes('TỐT') || upper.includes('TOT')) return 'GRADUATED';
  if (upper === 'DROPPED' || upper.includes('BỎ') || upper.includes('BO')
    || upper.includes('THÔI') || upper.includes('THOI')) return 'DROPPED';
  return raw;
};

// Education fields arrive as parallel JSON arrays: index i of each array is one entry.
const pickAt = (value, index) => (Array.isArray(value) ? value[index] : value);
const entryCount = (...values) => Math.max(
  0,
  ...values.map((value) => (Array.isArray(value) ? value.length : (value ? 1 : 0))),
);
const buildAcademicEntries = (profile) => {
  if (!profile) return [];
  const count = entryCount(
    profile.faculty,
    profile.major,
    profile.program,
    profile.startedYear,
    profile.graduatedYear,
    profile.graduationStatus,
  );
  return Array.from({ length: count }, (_, index) => ({
    faculty: pickAt(profile.faculty, index),
    program: pickAt(profile.program, index),
    major: pickAt(profile.major, index),
    startedYear: pickAt(profile.startedYear, index),
    graduatedYear: pickAt(profile.graduatedYear, index),
    graduationStatus: pickAt(profile.graduationStatus, index),
  })).filter((row) => Object.values(row).some(Boolean));
};

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
  // Tabs: two request feeds (document proofs / peer verifications) plus the trusted-verifier roster.
  const [activeTab, setActiveTab] = useState('PROOF');
  const isTrustedTab = activeTab === TRUSTED_TAB;
  const requestType = isTrustedTab ? null : activeTab;

  const [verifiers, setVerifiers] = useState([]);
  const [verifiersLoading, setVerifiersLoading] = useState(false);
  // API trả về trọn danh sách (không có tham số search/page) nên lọc và phân trang ở client.
  const [verifierSearch, setVerifierSearch] = useState('');
  const [verifierPage, setVerifierPage] = useState(0);
  const [verifierRowsPerPage, setVerifierRowsPerPage] = useState(10);
  // Gỡ quyền là hành động khó thấy hậu quả nên phải hỏi lại trước khi làm.
  const [verifierToRevoke, setVerifierToRevoke] = useState(null);
  // Tìm thành viên để cấp quyền xác thực tin cậy.
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const debouncedCandidateSearch = useDebounce(candidateSearch, 400);

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
  // Self-declared profile of the sender, loaded when the proof dialog opens.
  const [senderProfile, setSenderProfile] = useState(null);
  const [senderLoading, setSenderLoading] = useState(false);

  useEffect(() => {
    setBreadcrumbs?.([{ label: t('nav_verifications'), active: true }]);
  }, [setBreadcrumbs]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getVerificationRequests(pendingOnly, page, rowsPerPage, searchQuery, stableOrgId || null, requestType);
      const data = res?.data?.data || {};
      const items = data.items || [];
      setRequests(items);
      setTotalCount(data.totalElements || data.totalItem || data.totalItems || 0);
      return items;
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || t('verif_error_load'), { variant: 'error' });
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isTrustedTab) return;
    void fetchRequests();
  }, [page, rowsPerPage, pendingOnly, searchQuery, stableOrgId, requestType, isTrustedTab]);

  const fetchVerifiers = async () => {
    if (!stableOrgId) return;
    setVerifiersLoading(true);
    try {
      const res = await getTrustedVerifiers(stableOrgId);
      setVerifiers(res?.data?.data || []);
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || t('verif_trusted_error_load'), { variant: 'error' });
      setVerifiers([]);
    } finally {
      setVerifiersLoading(false);
    }
  };

  useEffect(() => {
    if (!isTrustedTab) return;
    void fetchVerifiers();
  }, [isTrustedTab, stableOrgId]);

  const revokeVerifier = async () => {
    if (!verifierToRevoke) return;
    setSubLoading(true);
    try {
      await updateTrustedVerifier(verifierToRevoke.userId, stableOrgId, false);
      enqueueSnackbar(t('verif_trusted_revoked'), { variant: 'success' });
      setVerifierToRevoke(null);
      void fetchVerifiers();
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || t('verif_trusted_error_revoke'), { variant: 'error' });
    } finally {
      setSubLoading(false);
    }
  };

  // Tìm thành viên trong tổ chức, bỏ những người đã là người xác thực tin cậy.
  // Chỉ lấy role USER: admin/staff bị query trusted-verifier loại ra, nếu cho chọn ở đây
  // thì cấp quyền sẽ "thành công" nhưng người đó không bao giờ hiện trong danh sách.
  useEffect(() => {
    if (!grantDialogOpen || !stableOrgId) return undefined;

    let cancelled = false;
    setCandidatesLoading(true);
    getUsers(0, 20, debouncedCandidateSearch, 'USER', 'ALL', stableOrgId)
      .then((res) => {
        if (cancelled) return;
        const items = res?.data?.data?.items || [];
        const existing = new Set(verifiers.map((v) => v.userId));
        setCandidates(items.filter((u) => !existing.has(u.id)));
      })
      .catch(() => {
        if (!cancelled) setCandidates([]);
      })
      .finally(() => {
        if (!cancelled) setCandidatesLoading(false);
      });

    return () => { cancelled = true; };
  }, [grantDialogOpen, debouncedCandidateSearch, stableOrgId, verifiers]);

  const closeGrantDialog = () => {
    setGrantDialogOpen(false);
    setSelectedCandidates([]);
    setCandidateSearch('');
    setCandidates([]);
  };

  // Cấp cho từng người một; một người lỗi không được làm hỏng cả mẻ.
  const grantVerifiers = async () => {
    if (selectedCandidates.length === 0) return;
    setSubLoading(true);
    try {
      const results = await Promise.allSettled(
        selectedCandidates.map((user) => updateTrustedVerifier(user.id, stableOrgId, true)),
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      const granted = results.length - failed;

      if (granted > 0) {
        enqueueSnackbar(t('verif_trusted_granted', { count: granted }), { variant: 'success' });
      }
      if (failed > 0) {
        enqueueSnackbar(t('verif_trusted_error_grant_some', { count: failed }), { variant: 'error' });
      }
      closeGrantDialog();
      void fetchVerifiers();
    } finally {
      setSubLoading(false);
    }
  };

  // Đọc tài liệu chạy nền xong sau khi yêu cầu đã nằm trong danh sách, nên phải tự làm mới —
  // nếu không admin sẽ thấy mãi trạng thái "chưa đọc xong" cho tới khi bấm lại.
  useEffect(() => {
    if (isTrustedTab) return undefined;

    const handleOcrReady = async (event) => {
      const requestId = event.detail?.requestId;
      if (!requestId) return;

      const items = await fetchRequests();
      // Dialog giữ bản sao riêng của yêu cầu nên phải thay bằng bản vừa có chữ đọc được.
      setDocumentViewerRequest((current) => {
        if (!current || current.id !== requestId) return current;
        return items.find((item) => item.id === requestId) || current;
      });
    };

    window.addEventListener(VERIFICATION_OCR_READY_EVENT, handleOcrReady);
    return () => window.removeEventListener(VERIFICATION_OCR_READY_EVENT, handleOcrReady);
  }, [isTrustedTab, page, rowsPerPage, pendingOnly, searchQuery, stableOrgId, requestType]);

  // Pull the sender's self-declared education info to review the document against.
  useEffect(() => {
    const memberId = documentViewerRequest?.memberId;
    if (!memberId) return undefined;

    let cancelled = false;
    setSenderLoading(true);
    getUserById(memberId)
      .then((res) => {
        if (!cancelled) setSenderProfile(res?.data?.data || null);
      })
      .catch(() => {
        if (!cancelled) setSenderProfile(null);
      })
      .finally(() => {
        if (!cancelled) setSenderLoading(false);
      });

    return () => { cancelled = true; };
  }, [documentViewerRequest]);

  // Proof requests open the combined document dialog (evidence + review in one place);
  // peer requests keep the plain review dialog since they have no document to show.
  const handleReview = (request) => {
    setSelectedRequest(request);
    setAdminNote(request.adminNote || '');
    if (isProofRequest(request)) {
      setDocumentZoom(1);
      setDocumentViewerRequest(request);
    } else {
      setReviewDialogOpen(true);
    }
  };

  const handleOpenDocument = (request, event) => {
    event?.stopPropagation();
    handleReview(request);
  };

  const closeDocumentDialog = () => {
    setDocumentViewerRequest(null);
    setSenderProfile(null);
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
      closeDocumentDialog();
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
      closeDocumentDialog();
      void fetchRequests();
    } catch (error) {
      console.error('Reopen verification request error:', error);
      enqueueSnackbar(error?.response?.data?.message || t('verif_error_reopen'), { variant: 'error' });
    } finally {
      setSubLoading(false);
    }
  };

  // Lọc theo MSSV / họ tên / email, giống ô tìm kiếm bên danh sách người dùng.
  const filteredVerifiers = useMemo(() => {
    const keyword = stripDiacritics(verifierSearch).trim();
    if (!keyword) return verifiers;
    return verifiers.filter((v) => [v.fullName, v.email, v.studentId]
      .some((field) => stripDiacritics(field).includes(keyword)));
  }, [verifiers, verifierSearch]);

  const pagedVerifiers = useMemo(() => {
    const start = verifierPage * verifierRowsPerPage;
    return filteredVerifiers.slice(start, start + verifierRowsPerPage);
  }, [filteredVerifiers, verifierPage, verifierRowsPerPage]);

  const academicEntries = useMemo(() => buildAcademicEntries(senderProfile), [senderProfile]);

  // Rejecting sends the note to the user as the reason, so it must not be empty.
  const missingRejectReason = !adminNote.trim();

  // Fall back to the stored value when it is not one of the known statuses.
  const formatGraduationStatus = (value) => {
    const key = normalizeGraduationStatus(value);
    return key ? t(`graduation_status.${key}`, { defaultValue: key }) : '';
  };

  /**
   * Chỉ cảnh báo (sai lệch, ảnh không đọc được) mới đủ sức đề nghị từ chối.
   * Thiếu thông tin tự khai là mức info: nhắc admin lưu ý chứ không phải cớ để từ chối.
   */
  const recommendation = (findings) => {
    // Chưa đọc xong tài liệu thì chưa có cơ sở nào để khuyên duyệt hay từ chối.
    if (findings.some((f) => f.severity === 'pending')) return 'pending';
    if (findings.some((f) => f.severity === 'warning')) return 'reject';
    if (findings.length > 0) return 'review';
    return 'approve';
  };

  const documentFindings = useMemo(() => {
    if (!documentViewerRequest) return [];
    return buildDocumentFindings({
      ocrText: documentViewerRequest.aiSummary,
      studentId: senderProfile?.studentId || documentViewerRequest.studentId,
      fullName: documentViewerRequest.fullName,
      entry: academicEntries[0],
    });
  }, [documentViewerRequest, senderProfile, academicEntries]);

  const findingMessage = (finding) => {
    const params = { ...finding.params };
    if (params.fields) {
      params.fields = params.fields
        .map((field) => t(FIELD_LABEL_KEYS[field], { defaultValue: field }))
        .join(', ');
    }
    return t(`verif_check_${finding.code}`, params);
  };

  const renderInfoRow = (label, value) => {
    if (value === null || value === undefined || value === '') return null;
    return (
      <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="baseline">
        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
          {String(value)}
        </Typography>
      </Stack>
    );
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

  const verifierColumns = useMemo(() => [
    {
      id: 'fullName',
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
      ),
    },
    { id: 'studentId', label: t('edu_col_student_id'), render: (val) => val || '-' },
    { id: 'program', label: t('edu_field_program'), render: (val) => formatJsonList(val) },
    { id: 'major', label: t('edu_field_major'), render: (val) => formatJsonList(val) },
    {
      id: 'actions',
      label: t('actions'),
      align: 'right',
      width: 120,
      render: (_, r) => (
        <Tooltip title={t('verif_trusted_revoke')}>
          <span>
            <IconButton size="small" color="error" disabled={submitting} onClick={() => setVerifierToRevoke(r)}>
              <PersonRemoveOutlinedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      ),
    },
  ], [theme, submitting]);

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
      id: 'documentUrl',
      label: requestType === 'PEER' ? t('verif_dialog_peer_evidence') : t('verif_col_document'),
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
      width: 170,
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
                <span>
                  <IconButton
                    size="small"
                    color="success"
                    disabled={submitting}
                    onClick={(e) => {
                      e.stopPropagation();
                      submitReview(r, 'APPROVED');
                    }}
                  >
                    <CheckCircleOutlineIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {isPending && isProofRequest(r) && (
              // Từ chối bắt buộc có lý do nên phải mở dialog, không từ chối thẳng từ danh sách.
              <Tooltip title={t('verif_reject_opens_dialog')}>
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    disabled={submitting}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReview(r);
                    }}
                  >
                    <HighlightOffIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {isPending && (
              <Tooltip title={t('verif_reopen_form')}>
                <span>
                  <IconButton
                    size="small"
                    color="warning"
                    disabled={submitting}
                    onClick={(e) => {
                      e.stopPropagation();
                      submitReopen(r);
                    }}
                  >
                    <RestartAltOutlinedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Stack>
        );
      }
    }
  ], [theme, handleReview, submitReview, submitReopen, submitting, requestType]);

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

      <Tabs
        value={activeTab}
        onChange={(_, value) => { setActiveTab(value); setPage(0); }}
        sx={{ mb: 2 }}
      >
        <Tab value="PROOF" label={t('verif_tab_proof')} />
        <Tab value="PEER" label={t('verif_tab_peer')} />
        <Tab value={TRUSTED_TAB} label={t('verif_tab_trusted')} />
      </Tabs>

      {isTrustedTab ? (
        <AdminDataTable
          columns={verifierColumns}
          rows={pagedVerifiers}
          totalCount={filteredVerifiers.length}
          page={verifierPage}
          rowsPerPage={verifierRowsPerPage}
          onPageChange={(_, next) => setVerifierPage(next)}
          onRowsPerPageChange={(e) => { setVerifierRowsPerPage(Number(e.target.value)); setVerifierPage(0); }}
          searchValue={verifierSearch}
          onSearchChange={(value) => { setVerifierSearch(value); setVerifierPage(0); }}
          searchPlaceholder={t('verif_trusted_search_placeholder')}
          loading={verifiersLoading}
          actions={
            <Button
              variant="contained"
              startIcon={<PersonAddAltOutlinedIcon />}
              onClick={() => setGrantDialogOpen(true)}
            >
              {t('verif_trusted_add')}
            </Button>
          }
        />
      ) : (
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
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => !submitting && setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{t('verif_dialog_title')}</DialogTitle>
        <DialogContent dividers>
          {selectedRequest && (
            <Stack spacing={2.5} sx={{ py: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
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
                    <Iconify icon="mdi:text-recognition" /> {t('verif_document_extract')}
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

      {/* Proof review: sender info, OCR extract, document preview and decisions in one dialog */}
      <Dialog
        open={Boolean(documentViewerRequest)}
        onClose={() => !submitting && closeDocumentDialog()}
        maxWidth="xl"
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
          <span>{t('verif_dialog_title')}</span>
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
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
              aria-label={t('verif_zoom_level', { defaultValue: 'Zoom' })}
              sx={{ flex: 1 }}
            />
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, minWidth: 48, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
            >
              {Math.round(documentZoom * 100)}%
            </Typography>
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
            <Button size="small" onClick={() => setDocumentZoom(1)} disabled={documentZoom === 1}>
              {t('verif_zoom_reset', { defaultValue: 'Về 100%' })}
            </Button>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ height: { xs: '78vh', md: '78vh' }, p: 0, overflow: 'hidden' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} sx={{ height: '100%' }}>
            {/* Sender context + decision notes */}
            <Box
              sx={{
                width: { xs: '100%', md: 460 },
                flexShrink: 0,
                overflow: 'auto',
                p: 2.5,
                borderRight: { md: `1px solid ${theme.palette.divider}` },
                borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: 0 },
              }}
            >
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    {t('verif_dialog_sender')}
                  </Typography>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                      src={documentViewerRequest?.avatarUrl}
                      sx={{ width: 40, height: 40, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 700 }}
                    >
                      {(documentViewerRequest?.fullName || documentViewerRequest?.studentId || '?')[0].toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {documentViewerRequest?.fullName || documentViewerRequest?.studentId}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {documentViewerRequest?.email}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    {t('verif_sender_declared_info')}
                  </Typography>
                  {senderLoading ? (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">{t('verif_sender_loading')}</Typography>
                    </Stack>
                  ) : (
                    <Stack spacing={1.5}>
                      {renderInfoRow(t('edu_col_student_id'), senderProfile?.studentId || documentViewerRequest?.studentId)}
                      {academicEntries.length === 0 && (
                        <Typography variant="body2" color="text.secondary">
                          {t('verif_no_declared_info')}
                        </Typography>
                      )}
                      {academicEntries.map((entry, index) => (
                        <Box
                          key={`edu-${index}`}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            bgcolor: alpha(theme.palette.primary.main, 0.03),
                          }}
                        >
                          <Stack spacing={0.75}>
                            {renderInfoRow(t('edu_field_faculty'), entry.faculty)}
                            {renderInfoRow(t('edu_field_program'), entry.program)}
                            {renderInfoRow(t('edu_field_major'), entry.major)}
                            {renderInfoRow(t('edu_field_started_year'), entry.startedYear)}
                            {renderInfoRow(t('edu_field_graduated_year'), entry.graduatedYear)}
                            {renderInfoRow(t('edu_field_graduation_status'), formatGraduationStatus(entry.graduationStatus))}
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>

                {documentViewerRequest?.aiSummary && (
                  <Box sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.08), borderRadius: 2, border: `1px dashed ${theme.palette.info.main}` }}>
                    <Typography variant="caption" sx={{ color: 'info.main', fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Iconify icon="mdi:text-recognition" /> {t('verif_document_extract')}
                    </Typography>
                    {/* PDF có sẵn text layer hoặc Tesseract không qua AI nên có thể rất dài:
                        giới hạn chiều cao để nó không đẩy phần khuyến nghị ra khỏi tầm mắt. */}
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.primary',
                        whiteSpace: 'pre-line',
                        lineHeight: 1.6,
                        maxHeight: 220,
                        overflow: 'auto',
                      }}
                    >
                      {documentViewerRequest.aiSummary}
                    </Typography>
                  </Box>
                )}

                {/* Đối chiếu tài liệu với thông tin tự khai để admin quyết nhanh */}
                {(() => {
                  const verdict = recommendation(documentFindings);
                  const tone = VERDICT_TONE[verdict];
                  return (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: `1px dashed ${theme.palette[tone].main}`,
                        bgcolor: alpha(theme.palette[tone].main, 0.08),
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: `${tone}.main`,
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        <Iconify icon="mdi:clipboard-check-outline" /> {t('verif_check_title')}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{ color: `${tone}.main`, fontWeight: 700, mt: 1, mb: documentFindings.length ? 1 : 0 }}
                      >
                        {t(`verif_verdict_${verdict}`)}
                      </Typography>

                      {documentFindings.length === 0 ? (
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {t('verif_check_ok')}
                        </Typography>
                      ) : (
                        <Stack component="ul" spacing={0.75} sx={{ m: 0, pl: 2.5 }}>
                          {documentFindings.map((finding) => (
                            <Typography
                              key={finding.code}
                              component="li"
                              variant="body2"
                              sx={{ color: 'text.primary', lineHeight: 1.5 }}
                            >
                              {findingMessage(finding)}
                            </Typography>
                          ))}
                        </Stack>
                      )}
                    </Box>
                  );
                })()}

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
                    helperText={missingRejectReason ? t('verif_admin_note_reject_required') : undefined}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Box>
              </Stack>
            </Box>

            {/* Document preview */}
            <Box
              sx={{
                flex: 1,
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
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="outlined" color="secondary" disabled={submitting} onClick={closeDocumentDialog}>
            {t('verif_btn_close')}
          </Button>
          {isPendingRequest(documentViewerRequest) && (
            <>
              <Tooltip title={missingRejectReason ? t('verif_reject_needs_note') : ''}>
                <span>
                  <Button
                    variant="contained"
                    color="error"
                    disabled={submitting || missingRejectReason}
                    startIcon={<HighlightOffIcon />}
                    onClick={() => submitReview(documentViewerRequest, 'REJECTED', adminNote)}
                  >
                    {t('verif_btn_reject')}
                  </Button>
                </span>
              </Tooltip>
              <Button
                variant="contained"
                color="success"
                disabled={submitting}
                startIcon={<CheckCircleOutlineIcon />}
                onClick={() => submitReview(documentViewerRequest, 'APPROVED', adminNote)}
              >
                {t('verif_btn_approve')}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Xác nhận trước khi gỡ quyền xác thực tin cậy */}
      <Dialog open={Boolean(verifierToRevoke)} onClose={() => !submitting && setVerifierToRevoke(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{t('verif_trusted_revoke_title')}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {t('verif_trusted_revoke_confirm', {
              name: verifierToRevoke?.fullName || verifierToRevoke?.studentId || '',
            })}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
            {t('verif_trusted_revoke_hint')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="outlined" color="secondary" disabled={submitting} onClick={() => setVerifierToRevoke(null)}>
            {t('verif_btn_close')}
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={submitting}
            startIcon={<PersonRemoveOutlinedIcon />}
            onClick={revokeVerifier}
          >
            {t('verif_trusted_revoke')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tìm và cấp quyền xác thực tin cậy */}
      <Dialog open={grantDialogOpen} onClose={() => !submitting && closeGrantDialog()} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{t('verif_trusted_add_title')}</DialogTitle>
        <DialogContent dividers sx={{ minHeight: 420 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
            {t('verif_trusted_add_hint')}
          </Typography>
          <Autocomplete
            multiple
            disableCloseOnSelect
            options={candidates}
            loading={candidatesLoading}
            value={selectedCandidates}
            onChange={(_, value) => setSelectedCandidates(value)}
            inputValue={candidateSearch}
            onInputChange={(_, value) => setCandidateSearch(value)}
            filterOptions={(options) => options}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => option.fullName || option.email || ''}
            noOptionsText={t('verif_trusted_no_candidate')}
            loadingText={t('verif_sender_loading')}
            renderOption={(props, option) => {
              const { key, ...rest } = props;
              const details = [
                formatJsonList(option.program),
                formatJsonList(option.startedYear),
                option.studentId,
              ].filter((part) => part && part !== '-');
              return (
                <Box component="li" key={key} {...rest} sx={{ gap: 1.5 }}>
                  <Avatar
                    src={option.avatarUrl}
                    sx={{ width: 34, height: 34, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontSize: 13, fontWeight: 700 }}
                  >
                    {(option.fullName || option.email || '?')[0].toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                      {option.fullName || option.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                      {details.join(' · ') || option.email}
                    </Typography>
                  </Box>
                </Box>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                autoFocus
                label={t('verif_trusted_search_label')}
                placeholder={t('verif_search_placeholder')}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {candidatesLoading ? <CircularProgress size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="outlined" color="secondary" disabled={submitting} onClick={closeGrantDialog}>
            {t('verif_btn_close')}
          </Button>
          <Button
            variant="contained"
            color="success"
            disabled={submitting || selectedCandidates.length === 0}
            startIcon={<PersonAddAltOutlinedIcon />}
            onClick={grantVerifiers}
          >
            {selectedCandidates.length > 1
              ? t('verif_trusted_grant_many', { count: selectedCandidates.length })
              : t('verif_trusted_grant')}
          </Button>
        </DialogActions>
      </Dialog>

      <ActionOverlay open={submitting} />
    </Box>
  );
};

export default AdminVerificationsPage;
