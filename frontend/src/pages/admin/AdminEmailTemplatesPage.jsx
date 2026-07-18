import { useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, TextField, Stack, IconButton,
  Chip, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Tabs, Tab, Tooltip, CircularProgress, Divider
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CodeIcon from '@mui/icons-material/Code';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import AdminDataTable from '../../components/admin/AdminDataTable';
import WYSIWYG from '../../components/WYSIWYG';
import useAdminEmailTemplates, { buildSampleData } from '../../hooks/admin/useAdminEmailTemplates';
import { useSnackbar } from 'notistack';

const tokenFor = (key) => `[[\${${key}}]]`;

/** {regionKey: value} từ danh sách vùng của template. */
const buildRegionValues = (regions = []) =>
  (regions ?? []).reduce((acc, r) => {
    if (r?.key) acc[r.key] = r.html ?? '';
    return acc;
  }, {});

const AdminEmailTemplatesPage = () => {
  const { t } = useTranslation('admin');
  const { setBreadcrumbs } = useOutletContext() || {};
  const {
    templates, loading, refresh,
    getById, update, updateRegions, resetToDefault, preview, previewRegions, sendTest,
  } = useAdminEmailTemplates();

  const [selected, setSelected] = useState(null); // template đang sửa (full detail)
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');       // dùng cho chế độ HTML nâng cao
  const [regionValues, setRegionValues] = useState({}); // dùng cho chế độ vùng
  const [advanced, setAdvanced] = useState(false);  // true = chế độ HTML nâng cao
  const [mode, setMode] = useState('html');         // 'html' | 'visual' (trong chế độ nâng cao)
  const [saving, setSaving] = useState(false);
  const [initial, setInitial] = useState({ subject: '', content: '', regionValues: {} });

  const [previewState, setPreviewState] = useState({ open: false, loading: false, html: '', subject: '', error: null });
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [testState, setTestState] = useState({ open: false, email: '', sending: false });
  const { enqueueSnackbar } = useSnackbar();

  const htmlRef = useRef(null);

  const isRegionMode = Boolean(selected?.editable) && !advanced;
  const templateColumns = useMemo(() => [
    {
      id: 'templateCode',
      label: t('et_col_code'),
      minWidth: 220,
      render: (value) => (
        <Typography component="span" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
          {value}
        </Typography>
      ),
    },
    {
      id: 'description',
      label: t('et_col_description'),
      minWidth: 320,
    },
    {
      id: 'actions',
      label: t('col_actions'),
      align: 'right',
      width: 120,
      render: (_, row) => (
        <IconButton color="primary" onClick={() => openEditor(row.id)} title={t('et_edit')}>
          <EditOutlinedIcon />
        </IconButton>
      ),
    },
  ], [t]);

  const dirty = useMemo(() => {
    if (!selected) return false;
    if (subject !== initial.subject) return true;
    return isRegionMode
      ? JSON.stringify(regionValues) !== JSON.stringify(initial.regionValues)
      : content !== initial.content;
  }, [selected, subject, content, regionValues, initial, isRegionMode]);

  useEffect(() => {
    if (setBreadcrumbs) {
      setBreadcrumbs([{ label: t('nav_email_templates'), active: true }]);
    }
  }, [setBreadcrumbs, t]);

  const applyDetail = (detail) => {
    const rv = buildRegionValues(detail?.regions);
    setSelected(detail);
    setSubject(detail?.subject ?? '');
    setContent(detail?.content ?? '');
    setRegionValues(rv);
    setAdvanced(!detail?.editable); // template chưa có vùng -> vào thẳng chế độ HTML
    setMode('html');
    setInitial({ subject: detail?.subject ?? '', content: detail?.content ?? '', regionValues: rv });
  };

  const openEditor = async (id) => {
    setLoadingDetail(true);
    try {
      applyDetail(await getById(id));
    } catch {
      enqueueSnackbar(t('et_load_error'), { variant: 'error' });
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeEditor = () => {
    setSelected(null);
    setSubject('');
    setContent('');
    setRegionValues({});
  };

  const setRegion = (key, value) => setRegionValues((prev) => ({ ...prev, [key]: value }));

  const insertVariable = async (key) => {
    const token = tokenFor(key);
    // Chế độ HTML nâng cao: chèn thẳng vào vị trí con trỏ trong ô textarea.
    if (advanced && mode === 'html' && htmlRef.current) {
      const el = htmlRef.current;
      const start = el.selectionStart ?? content.length;
      const end = el.selectionEnd ?? content.length;
      setContent(content.slice(0, start) + token + content.slice(end));
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + token.length;
        el.setSelectionRange(pos, pos);
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(token);
      enqueueSnackbar(t('et_var_copied', { token }), { variant: 'info' });
    } catch {
      enqueueSnackbar(token, { variant: 'info' });
    }
  };

  const handlePreview = async () => {
    setPreviewState({ open: true, loading: true, html: '', subject: '', error: null });
    try {
      const sampleData = buildSampleData(selected?.variables);
      const result = isRegionMode
        ? await previewRegions(selected.id, { subject, regions: regionValues, sampleData })
        : await preview({ subject, content, sampleData });
      setPreviewState({
        open: true, loading: false,
        html: result?.html ?? '', subject: result?.subject ?? '', error: result?.error ?? null,
      });
    } catch {
      setPreviewState({ open: true, loading: false, html: '', subject: '', error: t('et_preview_error') });
    }
  };

  const handleSave = async () => {
    if (!isRegionMode && !content?.trim()) {
      enqueueSnackbar(t('et_content_required'), { variant: 'error' });
      return;
    }
    setSaving(true);
    try {
      const detail = isRegionMode
        ? await updateRegions(selected.id, { subject, regions: regionValues })
        : await update(selected.id, { subject, content });
      // Đồng bộ lại từ server để giữ nội dung/vùng chuẩn (marker được ghép lại phía backend).
      if (detail?.id) applyDetail(detail);
      enqueueSnackbar(t('et_saved'), { variant: 'success' });
      await refresh();
    } catch {
      enqueueSnackbar(t('et_save_error'), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const detail = await resetToDefault(selected.id);
      if (detail?.id) applyDetail(detail);
      setResetConfirm(false);
      enqueueSnackbar(t('et_reset_done'), { variant: 'success' });
      await refresh();
    } catch {
      enqueueSnackbar(t('et_reset_error'), { variant: 'error' });
    } finally {
      setResetting(false);
    }
  };

  const handleSendTest = async () => {
    const email = testState.email.trim();
    if (!email) return;
    setTestState((s) => ({ ...s, sending: true }));
    try {
      const sampleData = buildSampleData(selected?.variables);
      const rendered = isRegionMode
        ? await previewRegions(selected.id, { subject, regions: regionValues, sampleData })
        : await preview({ subject, content, sampleData });
      if (rendered?.error) {
        throw new Error(rendered.error);
      }
      await sendTest({
        recipientEmail: email,
        subject: rendered?.subject ?? subject,
        content: rendered?.html ?? content,
        sampleData: {},
      });
      setTestState({ open: false, email: '', sending: false });
      enqueueSnackbar(t('et_send_test_success', { email }), { variant: 'success' });
    } catch {
      setTestState((s) => ({ ...s, sending: false }));
      enqueueSnackbar(t('et_send_test_error'), { variant: 'error' });
    }
  };

  const renderList = () => (
    <AdminDataTable
      columns={templateColumns}
      rows={templates}
      totalCount={templates.length}
      page={0}
      rowsPerPage={Math.max(templates.length, 10)}
      loading={loading}
      emptyMessage={t('et_no_templates')}
      getRowId={(row) => row.id}
    />
  );

  const renderVariablesReference = () => (
    selected.variables?.length > 0 && (
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 700 }}>
          {isRegionMode ? t('et_variables_readonly_label') : t('et_variables_label')}
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
    )
  );

  const renderRegionEditor = () => (
    <Stack spacing={2.5} divider={<Divider flexItem />}>
      {(selected.regions ?? []).map((r) => (
        <Box key={r.key}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            {r.label || r.key}
          </Typography>
          {r.type === 'text' ? (
            <TextField
              value={regionValues[r.key] ?? ''}
              onChange={(e) => setRegion(r.key, e.target.value)}
              fullWidth
              size="small"
            />
          ) : (
            <WYSIWYG
              value={regionValues[r.key] ?? ''}
              onChange={(val) => setRegion(r.key, val)}
              height={160}
              allowImages={false}
            />
          )}
        </Box>
      ))}
    </Stack>
  );

  const renderAdvancedEditor = () => (
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
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {selected.editable && (
              <Button
                variant="text"
                size="small"
                startIcon={<CodeIcon />}
                onClick={() => setAdvanced((v) => !v)}
              >
                {advanced ? t('et_mode_easy') : t('et_mode_advanced')}
              </Button>
            )}
            <Tooltip title={t('et_reset_hint')}>
              <Button variant="outlined" color="warning" size="small" startIcon={<RestartAltIcon />} onClick={() => setResetConfirm(true)}>
                {t('et_reset')}
              </Button>
            </Tooltip>
            <Button variant="outlined" startIcon={<VisibilityIcon />} onClick={handlePreview}>
              {t('et_preview')}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<SendOutlinedIcon />}
              onClick={() => setTestState({ open: true, email: '', sending: false })}
            >
              {t('et_send_test')}
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving || !dirty}
            >
              {t('et_save')}
            </Button>
          </Stack>
        )}
      >
        <Stack spacing={2.5}>
          <Alert severity="info">
            {isRegionMode ? t('et_easy_hint') : t('et_advanced_hint')}
          </Alert>

          <TextField
            label={t('et_subject_label')}
            placeholder={t('et_subject_placeholder')}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            fullWidth
            size="small"
          />

          {renderVariablesReference()}

          {isRegionMode ? renderRegionEditor() : renderAdvancedEditor()}
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
            <Typography color="error" sx={{ whiteSpace: 'pre-wrap' }}>{previewState.error}</Typography>
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

      <Dialog open={resetConfirm} onClose={() => !resetting && setResetConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{t('et_reset_confirm_title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('et_reset_confirm_body')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetConfirm(false)} disabled={resetting}>{t('et_reset_cancel')}</Button>
          <Button
            color="warning"
            variant="contained"
            onClick={handleReset}
            disabled={resetting}
            startIcon={resetting ? <CircularProgress size={18} color="inherit" /> : <RestartAltIcon />}
          >
            {t('et_reset_confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={testState.open}
        onClose={() => !testState.sending && setTestState((s) => ({ ...s, open: false }))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>{t('et_send_test_title')}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>{t('et_send_test_hint')}</DialogContentText>
          <TextField
            autoFocus
            type="email"
            label={t('et_send_test_email_label')}
            value={testState.email}
            onChange={(e) => setTestState((s) => ({ ...s, email: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendTest(); }}
            fullWidth
            size="small"
            disabled={testState.sending}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestState((s) => ({ ...s, open: false }))} disabled={testState.sending}>
            {t('et_send_test_cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSendTest}
            disabled={testState.sending || !testState.email.trim()}
            startIcon={testState.sending ? <CircularProgress size={18} color="inherit" /> : <SendOutlinedIcon />}
          >
            {t('et_send_test_send')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminEmailTemplatesPage;
