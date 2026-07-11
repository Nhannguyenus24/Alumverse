import { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, TextField, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, CircularProgress,
  Chip, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab,
  Snackbar, Tooltip,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SaveIcon from '@mui/icons-material/Save';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import WYSIWYG from '../../components/WYSIWYG';
import useAdminEmailTemplates, { buildSampleData } from '../../hooks/admin/useAdminEmailTemplates';

const tokenFor = (key) => `[[\${${key}}]]`;

const AdminEmailTemplatesPage = () => {
  const { t } = useTranslation('admin');
  const { setBreadcrumbs } = useOutletContext() || {};
  const { templates, loading, refresh, getById, update, preview } = useAdminEmailTemplates();

  const [selected, setSelected] = useState(null); // template đang sửa (full detail)
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [mode, setMode] = useState('html'); // 'html' | 'visual'
  const [saving, setSaving] = useState(false);

  const [previewState, setPreviewState] = useState({ open: false, loading: false, html: '', subject: '', error: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const htmlRef = useRef(null);

  useEffect(() => {
    if (setBreadcrumbs) {
      setBreadcrumbs([
        { label: t('breadcrumb_admin'), path: '../' },
        { label: t('nav_email_templates') },
      ]);
    }
  }, [setBreadcrumbs, t]);

  const openEditor = async (id) => {
    setLoadingDetail(true);
    try {
      const detail = await getById(id);
      setSelected(detail);
      setSubject(detail?.subject ?? '');
      setContent(detail?.content ?? '');
      setMode('html');
    } catch {
      setSnackbar({ open: true, message: t('et_load_error'), severity: 'error' });
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeEditor = () => {
    setSelected(null);
    setSubject('');
    setContent('');
  };

  const insertVariable = async (key) => {
    const token = tokenFor(key);
    if (mode === 'html' && htmlRef.current) {
      const el = htmlRef.current;
      const start = el.selectionStart ?? content.length;
      const end = el.selectionEnd ?? content.length;
      const next = content.slice(0, start) + token + content.slice(end);
      setContent(next);
      // Đặt lại con trỏ sau token vừa chèn
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + token.length;
        el.setSelectionRange(pos, pos);
      });
      return;
    }
    // Visual mode: copy token để admin dán vào vị trí mong muốn trong trình soạn thảo
    try {
      await navigator.clipboard.writeText(token);
      setSnackbar({ open: true, message: t('et_var_copied', { token }), severity: 'info' });
    } catch {
      setSnackbar({ open: true, message: token, severity: 'info' });
    }
  };

  const handlePreview = async () => {
    setPreviewState({ open: true, loading: true, html: '', subject: '', error: null });
    try {
      const sampleData = buildSampleData(selected?.variables);
      const result = await preview({ subject, content, sampleData });
      setPreviewState({
        open: true, loading: false,
        html: result?.html ?? '', subject: result?.subject ?? '', error: result?.error ?? null,
      });
    } catch {
      setPreviewState({ open: true, loading: false, html: '', subject: '', error: t('et_preview_error') });
    }
  };

  const handleSave = async () => {
    if (!content?.trim()) {
      setSnackbar({ open: true, message: t('et_content_required'), severity: 'error' });
      return;
    }
    setSaving(true);
    try {
      await update(selected.id, { subject, content });
      setSnackbar({ open: true, message: t('et_saved'), severity: 'success' });
      await refresh();
    } catch {
      setSnackbar({ open: true, message: t('et_save_error'), severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const renderList = () => (
    <AdminSectionPanel title={t('email_templates_title')} subtitle={t('email_templates_subtitle')}>
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 800 }}>{t('et_col_code')}</TableCell>
              <TableCell sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 800 }}>{t('et_col_description')}</TableCell>
              <TableCell align="right" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 800 }}>{t('col_actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3} align="center"><CircularProgress size={24} /></TableCell></TableRow>
            ) : templates.length === 0 ? (
              <TableRow><TableCell colSpan={3} align="center">{t('et_no_templates')}</TableCell></TableRow>
            ) : (
              templates.map((tpl) => (
                <TableRow key={tpl.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{tpl.templateCode}</TableCell>
                  <TableCell>{tpl.description}</TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => openEditor(tpl.id)} title={t('et_edit')}>
                      <EditOutlinedIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </AdminSectionPanel>
  );

  const renderEditor = () => (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={closeEditor} sx={{ mb: 2 }}>
        {t('et_back')}
      </Button>

      <AdminSectionPanel
        title={selected.templateCode}
        subtitle={selected.description}
        action={(
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<VisibilityIcon />} onClick={handlePreview}>
              {t('et_preview')}
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {t('et_save')}
            </Button>
          </Stack>
        )}
      >
        <Stack spacing={2.5}>
          <TextField
            label={t('et_subject_label')}
            placeholder={t('et_subject_placeholder')}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            fullWidth
            size="small"
          />

          {selected.variables?.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 700 }}>
                {t('et_variables_label')}
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {selected.variables.map((v) => (
                  <Tooltip key={v.key} title={`${v.label ?? v.key} — ${tokenFor(v.key)}`} placement="top">
                    <Chip
                      label={v.key}
                      size="small"
                      variant="outlined"
                      color="primary"
                      onClick={() => insertVariable(v.key)}
                    />
                  </Tooltip>
                ))}
              </Stack>
            </Box>
          )}

          <Box>
            <Tabs value={mode} onChange={(_, val) => setMode(val)} sx={{ mb: 1.5, minHeight: 40 }}>
              <Tab value="visual" label={t('et_tab_visual')} sx={{ minHeight: 40 }} />
              <Tab value="html" label={t('et_tab_html')} sx={{ minHeight: 40 }} />
            </Tabs>

            {mode === 'visual' ? (
              <>
                <Alert severity="info" sx={{ mb: 1.5 }}>{t('et_visual_warning')}</Alert>
                <WYSIWYG value={content} onChange={setContent} height={420} allowImages={false} />
              </>
            ) : (
              <TextField
                inputRef={htmlRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('et_html_placeholder')}
                fullWidth
                multiline
                minRows={18}
                InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.5 } }}
              />
            )}
          </Box>
        </Stack>
      </AdminSectionPanel>
    </Box>
  );

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
          {t('email_templates_title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
          {t('email_templates_subtitle')}
        </Typography>
      </Box>

      {loadingDetail ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : selected ? renderEditor() : renderList()}

      <Dialog open={previewState.open} onClose={() => setPreviewState((s) => ({ ...s, open: false }))} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {t('et_preview_title')}
          {previewState.subject && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t('et_subject_label')}: {previewState.subject}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {previewState.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
          ) : previewState.error ? (
            <Alert severity="error" sx={{ whiteSpace: 'pre-wrap' }}>{previewState.error}</Alert>
          ) : (
            <Box
              component="iframe"
              title="email-preview"
              srcDoc={previewState.html}
              sandbox=""
              sx={{ width: '100%', height: 520, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: '#fff' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewState((s) => ({ ...s, open: false }))}>{t('et_preview_close')}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminEmailTemplatesPage;
