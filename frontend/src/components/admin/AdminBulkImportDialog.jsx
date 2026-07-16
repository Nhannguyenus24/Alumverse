import { useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import AdminStatusChip from './AdminStatusChip';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

// ── Template ──────────────────────────────────────────────────────────────────
const TEMPLATE_HEADERS = [
  'email', 'fullName', 'studentId', 'role', 'password',
  'program', 'major', 'graduatedYear', 'graduationStatus',
  'verificationLevel', 'status',
];

const TEMPLATE_EXAMPLE = [
  'alumni@example.com', 'Nguyễn Văn A', '22127001', 'USER', '',
  'Chính quy', 'Công nghệ thông tin', '2024', 'GRADUATED', '2', 'ACTIVE',
];

const downloadTemplate = async () => {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, TEMPLATE_EXAMPLE]);
  ws['!cols'] = TEMPLATE_HEADERS.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Users');
  XLSX.writeFile(wb, 'bulk_import_template.xlsx');
};

// ── Validation helpers ─────────────────────────────────────────────────────────
const VALID_ROLES = ['USER', 'STAFF', 'ADMIN'];
const VALID_STATUSES = ['ACTIVE', 'INACTIVE', 'BANNED'];
const VALID_GRADUATION = ['STUDYING', 'GRADUATED', 'DROPPED'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateRow = (row, idx, t) => {
  const errors = [];
  if (!row.email || !EMAIL_RE.test(row.email.trim())) errors.push(t('bulk_err_email_invalid'));
  if (!row.fullName || !row.fullName.trim()) errors.push(t('bulk_err_fullname_required'));
  if (row.role && !VALID_ROLES.includes(row.role.toUpperCase())) errors.push(t('bulk_err_role_invalid', { options: VALID_ROLES.join('/') }));
  if (row.status && !VALID_STATUSES.includes(row.status.toUpperCase())) errors.push(t('bulk_err_status_invalid', { options: VALID_STATUSES.join('/') }));
  if (row.graduationStatus && !VALID_GRADUATION.includes(row.graduationStatus.toUpperCase())) errors.push(t('bulk_err_graduation_invalid', { options: VALID_GRADUATION.join('/') }));
  if (row.graduatedYear && !/^\d{4}$/.test(String(row.graduatedYear).trim())) errors.push(t('bulk_err_graduated_year'));
  if (row.verificationLevel !== undefined && row.verificationLevel !== '') {
    const vl = Number(row.verificationLevel);
    if (![0, 1, 2, 3, 4].includes(vl)) errors.push(t('bulk_err_verification_level'));
  }
  return { ...row, _rowIndex: idx, _errors: errors, _valid: errors.length === 0 };
};

// ── Status chip renderer ───────────────────────────────────────────────────────
const statusIcon = (s) => {
  if (s === 'SUCCESS') return <CheckCircleOutlineIcon fontSize="small" />;
  if (s === 'FAILED') return <ErrorOutlineIcon fontSize="small" />;
  return <WarningAmberOutlinedIcon fontSize="small" />;
};

// ── Main component ─────────────────────────────────────────────────────────────
const AdminBulkImportDialog = ({ open, onClose, organizationOptions = [], onBulkImport }) => {
  const theme = useTheme();
  const { t } = useTranslation(['admin', 'common']);
  const fileRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [step, setStep] = useState('upload'); // upload | preview | result
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const [selectedOrgId, setSelectedOrgId] = useState(
    organizationOptions.length > 0 ? Number(organizationOptions[0].id) : ''
  );

  const reset = () => {
    setRows([]);
    setFileName('');
    setStep('upload');
    setImporting(false);
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = () => { reset(); onClose(); };

  // ── Parse file ──────────────────────────────────────────────────────────────
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const XLSX = await import('xlsx');
        const wb = XLSX.read(ev.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!raw.length) { enqueueSnackbar(t('bulk_snack_empty_file'), { variant: 'error' }); return; }

        const parsed = raw.map((r, i) => validateRow({
          email: String(r.email || '').trim(),
          fullName: String(r.fullName || '').trim(),
          studentId: String(r.studentId || '').trim(),
          role: String(r.role || 'USER').trim().toUpperCase(),
          password: String(r.password || '').trim(),
          program: String(r.program || '').trim(),
          major: String(r.major || '').trim(),
          graduatedYear: r.graduatedYear !== '' ? String(r.graduatedYear).trim() : '',
          graduationStatus: String(r.graduationStatus || '').trim().toUpperCase(),
          verificationLevel: r.verificationLevel !== '' ? Number(r.verificationLevel) : 0,
          status: String(r.status || 'ACTIVE').trim().toUpperCase(),
          _importStatus: 'PENDING',
          _importReason: '',
        }, i, t));

        setRows(parsed);
        setFileName(file.name);
        setStep('preview');
      } catch {
        enqueueSnackbar(t('bulk_snack_read_failed'), { variant: 'error' });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const invalidCount = rows.filter((r) => !r._valid).length;
  const validCount = rows.filter((r) => r._valid).length;

  // ── Import ───────────────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!selectedOrgId) return;
    setImporting(true);

    const validRows = rows.filter((r) => r._valid);
    const members = validRows.map((r) => ({
      email: r.email,
      fullName: r.fullName,
      studentId: r.studentId || undefined,
      role: r.role || 'USER',
      password: r.password || undefined,
      program: r.program || undefined,
      major: r.major || undefined,
      graduatedYear: r.graduatedYear ? Number(r.graduatedYear) : undefined,
      graduationStatus: r.graduationStatus || undefined,
      verificationLevel: r.verificationLevel ?? 0,
      status: r.status || 'ACTIVE',
    }));

    try {
      const res = await onBulkImport({ organizationId: Number(selectedOrgId), members });
      // Merge server results back into rows for display
      const resultMap = {};
      (res?.results ?? []).forEach((r) => { resultMap[r.rowIndex] = r; });

      setRows((prev) => {
        let validIdx = 0;
        return prev.map((row) => {
          if (!row._valid) return row;
          const serverResult = resultMap[validIdx++];
          return {
            ...row,
            _importStatus: serverResult?.status ?? 'FAILED',
            _importReason: serverResult?.reason ?? '',
          };
        });
      });

      setResult(res);
      setStep('result');
    } catch (e) {
      setResult({ total: validRows.length, successCount: 0, failureCount: validRows.length, error: e?.message });
      setStep('result');
    } finally {
      setImporting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg" scroll="paper">
      <DialogTitle sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
        <UploadFileOutlinedIcon />
        {t('bulk_title')}
        {step === 'preview' && fileName && (
          <Chip label={fileName} size="small" sx={{ ml: 1, fontWeight: 500 }} />
        )}
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>

        {/* ── Step: Upload ── */}
        {step === 'upload' && (
          <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <Paper
              variant="outlined"
              sx={{
                width: '100%', maxWidth: 480, p: 4, borderRadius: 3,
                borderStyle: 'dashed', borderWidth: 2,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                cursor: 'pointer', '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
              }}
              onClick={() => fileRef.current?.click()}
            >
              <UploadFileOutlinedIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.7 }} />
              <Typography variant="subtitle1" fontWeight={700}>{t('bulk_drop_hint')}</Typography>
              <Typography variant="body2" color="text.secondary">{t('bulk_supported_formats')}</Typography>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={handleFile} />
              <Button variant="outlined" size="small" component="span" sx={{ mt: 1 }}>
                {t('bulk_choose_file')}
              </Button>
            </Paper>

            <Divider sx={{ width: '100%', maxWidth: 480 }}>{t('bulk_or')}</Divider>

            <Button
              variant="outlined"
              startIcon={<DownloadOutlinedIcon />}
              onClick={downloadTemplate}
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              {t('bulk_download_template')}
            </Button>

            <Alert severity="info" sx={{ width: '100%', maxWidth: 600 }}>
              <Typography variant="body2" component="div">
                <strong>{t('bulk_required_columns')}</strong> email, fullName<br />
                <strong>{t('bulk_optional_columns')}</strong> studentId, role ({t('bulk_default_user')}), password, program, major, graduatedYear, graduationStatus (STUDYING/GRADUATED/DROPPED), verificationLevel (0/1/2/3/4), status ({t('bulk_default_active')})
              </Typography>
            </Alert>
          </Box>
        )}

        {/* ── Step: Preview ── */}
        {step === 'preview' && (
          <Box>
            {/* Summary bar */}
            <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="body2"><strong>{rows.length}</strong> {t('bulk_rows')}</Typography>
              <Chip label={t('bulk_valid_count', { count: validCount })} color="success" size="small" />
              {invalidCount > 0 && <Chip label={t('bulk_invalid_count', { count: invalidCount })} color="error" size="small" />}
              <Box sx={{ flex: 1 }} />
              {/* Org selector */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">{t('bulk_organization')}</Typography>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(Number(e.target.value))}
                  style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', fontSize: 14 }}
                >
                  {organizationOptions.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </Box>
              <Tooltip title={t('bulk_clear_and_reselect')}>
                <IconButton size="small" onClick={reset}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {invalidCount > 0 && (
              <Alert severity="warning" sx={{ mx: 3, mb: 1 }}>
                {t('bulk_invalid_rows_warning', { count: invalidCount })}
              </Alert>
            )}

            <TableContainer sx={{ maxHeight: 420 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, minWidth: 40 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 200 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 150 }}>{t('bulk_col_fullname')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>MSSV</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('bulk_col_program')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('bulk_col_major')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('bulk_col_graduated_year')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('bulk_col_graduation_status')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('bulk_col_verification')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('bulk_col_status')}</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 180 }}>{t('bulk_col_error')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow
                      key={i}
                      sx={{
                        bgcolor: !row._valid ? alpha(theme.palette.error.main, 0.06) : undefined,
                        '&:hover': { bgcolor: !row._valid ? alpha(theme.palette.error.main, 0.1) : 'action.hover' },
                      }}
                    >
                      <TableCell>{i + 1}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>{row.email}</TableCell>
                      <TableCell>{row.fullName}</TableCell>
                      <TableCell>{row.studentId}</TableCell>
                      <TableCell>{row.role}</TableCell>
                      <TableCell>{row.program}</TableCell>
                      <TableCell>{row.major}</TableCell>
                      <TableCell>{row.graduatedYear}</TableCell>
                      <TableCell>{row.graduationStatus}</TableCell>
                      <TableCell>{row.verificationLevel}</TableCell>
                      <TableCell>{row.status}</TableCell>
                      <TableCell>
                        {row._errors.length > 0 ? (
                          <Typography variant="caption" color="error.main">
                            {row._errors.join('; ')}
                          </Typography>
                        ) : (
                          <CheckCircleOutlineIcon fontSize="small" color="success" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* ── Step: Result ── */}
        {step === 'result' && result && (
          <Box sx={{ p: 3 }}>
            <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
              <Paper sx={{ flex: 1, p: 2, borderRadius: 2, textAlign: 'center', bgcolor: alpha(theme.palette.success.main, 0.08) }}>
                <Typography variant="h4" fontWeight={800} color="success.main">{result.successCount}</Typography>
                <Typography variant="body2" color="text.secondary">{t('bulk_result_success')}</Typography>
              </Paper>
              <Paper sx={{ flex: 1, p: 2, borderRadius: 2, textAlign: 'center', bgcolor: alpha(theme.palette.error.main, 0.08) }}>
                <Typography variant="h4" fontWeight={800} color="error.main">{result.failureCount}</Typography>
                <Typography variant="body2" color="text.secondary">{t('bulk_result_failure')}</Typography>
              </Paper>
              <Paper sx={{ flex: 1, p: 2, borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={800}>{result.total}</Typography>
                <Typography variant="body2" color="text.secondary">{t('bulk_result_total')}</Typography>
              </Paper>
            </Stack>

            {result.successCount > 0 && (
              <LinearProgress
                variant="determinate"
                value={(result.successCount / result.total) * 100}
                color="success"
                sx={{ borderRadius: 4, height: 8, mb: 3 }}
              />
            )}

            <TableContainer sx={{ maxHeight: 360 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('bulk_col_fullname')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>MSSV</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('bulk_result_col_result')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('bulk_result_col_reason')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>{row.email}</TableCell>
                      <TableCell>{row.fullName}</TableCell>
                      <TableCell>{row.studentId}</TableCell>
                      <TableCell>
                        {!row._valid ? (
                          <Chip icon={<WarningAmberOutlinedIcon />} label={t('bulk_result_skipped')} size="small" color="warning" />
                        ) : (
                          <AdminStatusChip
                            icon={statusIcon(row._importStatus)}
                            size="small"
                            status={row._importStatus}
                            category="audit"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {!row._valid ? row._errors.join('; ') : (row._importReason || '')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {importing && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('bulk_importing_count', { count: validCount })}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        {step === 'result' ? (
          <>
            <Button onClick={reset} variant="outlined" sx={{ textTransform: 'none' }}>{t('bulk_import_more')}</Button>
            <Button onClick={handleClose} variant="outlined" color="secondary" sx={{ textTransform: 'none', fontWeight: 700 }}>{t('bulk_close')}</Button>
          </>
        ) : step === 'preview' ? (
          <>
            <Button onClick={reset} variant="outlined" color="secondary" sx={{ textTransform: 'none' }}>{t('bulk_cancel')}</Button>
            <Button
              variant="contained"
              disabled={validCount === 0 || importing || !selectedOrgId}
              onClick={handleImport}
              startIcon={importing ? <CircularProgress size={16} color="inherit" /> : <UploadFileOutlinedIcon />}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              {importing ? t('bulk_importing') : t('bulk_import_accounts', { count: validCount })}
            </Button>
          </>
        ) : (
          <Button onClick={handleClose} variant="outlined" color="secondary" sx={{ textTransform: 'none' }}>{t('bulk_close')}</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AdminBulkImportDialog;
