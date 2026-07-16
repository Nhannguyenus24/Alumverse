import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useOutletContext } from 'react-router';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';

import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import useAdminAiProviders from '../../hooks/admin/useAdminAiProviders';

const PROVIDER_TYPES = [
  { value: 'openai_compatible', label: 'OpenAI-compatible (OpenRouter, Groq, OpenAI...)' },
  { value: 'gemini', label: 'Google Gemini' },
];

const emptyForm = () => ({
  name: '',
  providerType: 'openai_compatible',
  baseUrl: 'https://openrouter.ai/api/v1',
  apiKey: '',
  enabled: true,
  priority: 0,
  models: [{ modelName: '', priority: 0, enabled: true }],
});

export const AdminAiProvidersContent = ({ showHeader = true }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation('admin');
  const { setBreadcrumbs } = useOutletContext() || {};
  const { providers, loading, create, update, remove, test, refresh } = useAdminAiProviders();

  const [modal, setModal] = useState({ open: false, mode: 'create', id: null });
  const [form, setForm] = useState(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (showHeader) {
      setBreadcrumbs?.([{ label: t('nav_ai_providers'), active: true }]);
    }
  }, [setBreadcrumbs, showHeader, t]);

  const openCreate = () => {
    setForm(emptyForm());
    setModal({ open: true, mode: 'create', id: null });
  };

  const openEdit = (p) => {
    setForm({
      name: p.name || '',
      providerType: p.providerType || 'openai_compatible',
      baseUrl: p.baseUrl || '',
      apiKey: '', // để trống = giữ key cũ
      enabled: p.enabled ?? true,
      priority: p.priority ?? 0,
      models: p.models?.length
        ? p.models.map((m) => ({ modelName: m.modelName, priority: m.priority ?? 0, enabled: m.enabled ?? true }))
        : [{ modelName: '', priority: 0, enabled: true }],
    });
    setModal({ open: true, mode: 'edit', id: p.id });
  };

  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const setModelAt = (idx, patch) => {
    setForm((f) => ({
      ...f,
      models: f.models.map((m, i) => (i === idx ? { ...m, ...patch } : m)),
    }));
  };

  const addModel = () =>
    setForm((f) => ({ ...f, models: [...f.models, { modelName: '', priority: f.models.length, enabled: true }] }));

  const removeModel = (idx) =>
    setForm((f) => ({ ...f, models: f.models.filter((_, i) => i !== idx) }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      enqueueSnackbar('Tên provider không được để trống', { variant: 'warning' });
      return;
    }
    const models = form.models
      .filter((m) => m.modelName.trim())
      .map((m, i) => ({ modelName: m.modelName.trim(), priority: Number(m.priority) || i, enabled: m.enabled }));
    if (models.length === 0) {
      enqueueSnackbar('Cần ít nhất một model', { variant: 'warning' });
      return;
    }
    const body = {
      name: form.name.trim(),
      providerType: form.providerType,
      baseUrl: form.providerType === 'gemini' ? null : form.baseUrl.trim(),
      apiKey: form.apiKey.trim() || null,
      enabled: form.enabled,
      priority: Number(form.priority) || 0,
      models,
    };
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await create(body);
        enqueueSnackbar('Đã tạo provider', { variant: 'success' });
      } else {
        await update(modal.id, body);
        enqueueSnackbar('Đã cập nhật provider', { variant: 'success' });
      }
      closeModal();
      refresh();
    } catch (e) {
      enqueueSnackbar(e?.response?.data?.message || 'Lưu thất bại', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
      enqueueSnackbar('Đã xóa provider', { variant: 'success' });
      refresh();
    } catch (e) {
      enqueueSnackbar(e?.response?.data?.message || 'Xóa thất bại', { variant: 'error' });
    }
    setDeleteTarget(null);
  };

  const handleTest = async (p, modelName) => {
    if (!modelName) {
      enqueueSnackbar('Provider chưa có model để test', { variant: 'warning' });
      return;
    }
    try {
      const reply = await test(p.id, modelName);
      enqueueSnackbar(`OK — ${p.name}/${modelName}: ${String(reply).slice(0, 60)}`, { variant: 'success' });
    } catch (e) {
      enqueueSnackbar(`Lỗi ${p.name}/${modelName}: ${e?.response?.data?.message || 'không kết nối được'}`, { variant: 'error' });
    }
  };

  return (
    <Box>
      {showHeader ? (
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
              {t('nav_ai_providers')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
              Quản lý provider và model AI. Chuỗi được thử theo thứ tự ưu tiên; hết quota một provider sẽ tự chuyển sang provider kế tiếp.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={openCreate}>
            Thêm provider
          </Button>
        </Box>
      ) : (
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
              {t('bot_providers_section_title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
              {t('bot_providers_section_subtitle')}
            </Typography>
          </Box>
          <Box sx={{ flexShrink: 0 }}>
            <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={openCreate}>
              {t('bot_provider_add')}
            </Button>
          </Box>
        </Box>
      )}

      {loading ? (
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={90} />
          <Skeleton variant="rounded" height={90} />
        </Stack>
      ) : providers.length === 0 ? (
        <Box sx={{ p: 6, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 3, border: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            Chưa có provider nào. Hệ thống đang dùng cấu hình mặc định trong application.properties.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {providers.map((p) => (
            <Box
              key={p.id}
              sx={{ p: 2.5, bgcolor: 'background.paper', borderRadius: 3, border: 1, borderColor: 'divider', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{p.name}</Typography>
                  <Chip size="small" label={`#${p.priority}`} />
                  <Chip
                    size="small"
                    color={p.enabled ? 'success' : 'default'}
                    label={p.enabled ? 'Bật' : 'Tắt'}
                  />
                  <Chip size="small" variant="outlined" label={p.providerType === 'gemini' ? 'Gemini' : 'OpenAI-compatible'} />
                </Stack>
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Sửa">
                    <IconButton size="small" onClick={() => openEdit(p)}><EditOutlinedIcon fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title="Xóa">
                    <IconButton size="small" color="error" onClick={() => setDeleteTarget(p)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Key: {p.hasApiKey ? p.apiKeyMasked : '(chưa đặt)'} {p.baseUrl ? `· ${p.baseUrl}` : ''}
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Stack spacing={0.5}>
                {(p.models || []).map((m) => (
                  <Stack key={m.id} direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Chip size="small" label={`#${m.priority}`} variant="outlined" />
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{m.modelName}</Typography>
                      {!m.enabled && <Chip size="small" label="Tắt" />}
                    </Stack>
                    <Tooltip title="Test model này">
                      <IconButton size="small" color="primary" onClick={() => handleTest(p, m.modelName)}>
                        <PlayArrowOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={modal.open} onClose={closeModal} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {modal.mode === 'create' ? 'Thêm AI provider' : 'Sửa AI provider'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1, overflow: 'visible' }}>
          <TextField
            label="Tên provider" required fullWidth value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            select label="Loại provider" fullWidth value={form.providerType}
            onChange={(e) => setForm((f) => ({ ...f, providerType: e.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            {PROVIDER_TYPES.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </TextField>
          {form.providerType !== 'gemini' && (
            <TextField
              label="Base URL" fullWidth value={form.baseUrl}
              onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
              helperText="VD: https://openrouter.ai/api/v1 · https://api.groq.com/openai/v1"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          )}
          <TextField
            label="API key" fullWidth type="password"
            value={form.apiKey}
            onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
            placeholder={modal.mode === 'edit' ? 'Để trống = giữ key cũ' : ''}
            helperText="Key được mã hóa trước khi lưu, không hiển thị lại."
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Ưu tiên" type="number" value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 140 }}
            />
            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} />
              <Typography variant="body2">{form.enabled ? 'Bật' : 'Tắt'}</Typography>
            </Stack>
          </Stack>

          <Divider textAlign="left"><Typography variant="caption">Model</Typography></Divider>
          {form.models.map((m, idx) => (
            <Stack key={idx} direction="row" spacing={1} alignItems="center">
              <TextField
                label={`Model #${idx}`} fullWidth value={m.modelName}
                onChange={(e) => setModelAt(idx, { modelName: e.target.value })}
                placeholder="vd: deepseek/deepseek-chat-v3-0324:free"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Ưu tiên" type="number" value={m.priority}
                onChange={(e) => setModelAt(idx, { priority: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: 100 }}
              />
              <Switch checked={m.enabled} onChange={(e) => setModelAt(idx, { enabled: e.target.checked })} />
              <IconButton size="small" color="error" onClick={() => removeModel(idx)} disabled={form.models.length <= 1}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}
          <Button size="small" startIcon={<AddOutlinedIcon />} onClick={addModel} sx={{ alignSelf: 'flex-start' }}>
            Thêm model
          </Button>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button variant="outlined" color="secondary" onClick={closeModal} disabled={saving}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>Lưu</Button>
        </DialogActions>
      </Dialog>

      <AdminConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Xóa AI provider"
        description={deleteTarget ? `Xóa provider "${deleteTarget.name}" và toàn bộ model của nó?` : ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
};

const AdminAiProvidersPage = () => <AdminAiProvidersContent />;

export default AdminAiProvidersPage;
