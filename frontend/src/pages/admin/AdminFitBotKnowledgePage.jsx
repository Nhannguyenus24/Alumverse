import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SyncOutlinedIcon from '@mui/icons-material/SyncOutlined';
import UploadFileIcon from '@mui/icons-material/UploadFile';

import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import useAdminFitBotKnowledge from '../../hooks/admin/useAdminFitBotKnowledge';

const emptyForm = () => ({
  title: '',
  content: '',
  enabled: true,
});

const statusColor = (status) => {
  if (status === 'SYNCED') return 'success';
  if (status === 'FAILED') return 'error';
  return 'warning';
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN');
};

const AdminFitBotKnowledgeContent = () => {
  const { t } = useTranslation('admin');
  const { enqueueSnackbar } = useSnackbar();
  const { items, loading, create, update, remove, sync, syncAll, refresh } = useAdminFitBotKnowledge();
  const fileInputRef = useRef(null);

  const [modal, setModal] = useState({ open: false, mode: 'create', id: null });
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openCreate = () => {
    setForm(emptyForm());
    setModal({ open: true, mode: 'create', id: null });
  };

  const openEdit = (item) => {
    setForm({
      title: item.title || '',
      content: item.content || '',
      enabled: item.enabled ?? true,
    });
    setModal({ open: true, mode: 'edit', id: item.id });
  };

  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      enqueueSnackbar(t('bot_knowledge_required'), { variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        content: form.content.trim(),
        enabled: form.enabled,
      };
      if (modal.mode === 'create') {
        await create(body);
        enqueueSnackbar(t('bot_knowledge_created'), { variant: 'success' });
      } else {
        await update(modal.id, body);
        enqueueSnackbar(t('bot_knowledge_updated'), { variant: 'success' });
      }
      closeModal();
      refresh();
    } catch (e) {
      enqueueSnackbar(e?.response?.data?.message || t('bot_knowledge_save_error'), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
      enqueueSnackbar(t('bot_knowledge_deleted'), { variant: 'success' });
      refresh();
    } catch (e) {
      enqueueSnackbar(e?.response?.data?.message || t('bot_knowledge_delete_error'), { variant: 'error' });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSync = async (item) => {
    setSyncingId(item.id);
    try {
      await sync(item.id);
      enqueueSnackbar(t('bot_knowledge_synced'), { variant: 'success' });
      refresh();
    } catch (e) {
      enqueueSnackbar(e?.response?.data?.message || t('bot_knowledge_sync_error'), { variant: 'error' });
    } finally {
      setSyncingId(null);
    }
  };

  const handleSyncAll = async () => {
    setSyncingId('all');
    try {
      await syncAll();
      enqueueSnackbar(t('bot_knowledge_sync_all_done'), { variant: 'success' });
      refresh();
    } catch (e) {
      enqueueSnackbar(e?.response?.data?.message || t('bot_knowledge_sync_error'), { variant: 'error' });
    } finally {
      setSyncingId(null);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = null;
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['md', 'txt'].includes(ext)) {
      enqueueSnackbar(t('bot_knowledge_import_type_error'), { variant: 'warning' });
      return;
    }
    const content = await file.text();
    setForm({ title: file.name, content, enabled: true });
    setModal({ open: true, mode: 'create', id: null });
  };

  const columns = useMemo(() => [
    { id: 'title', label: t('bot_knowledge_col_title'), minWidth: 220 },
    {
      id: 'enabled',
      label: t('bot_knowledge_col_enabled'),
      width: 120,
      render: (value) => <Chip size="small" color={value ? 'success' : 'default'} label={value ? t('common:enabled', 'Bật') : t('common:disabled', 'Tắt')} />,
    },
    {
      id: 'syncStatus',
      label: t('bot_knowledge_col_status'),
      width: 140,
      render: (value, row) => (
        <Tooltip title={row.syncError || ''}>
          <Chip size="small" color={statusColor(value)} label={value || 'PENDING'} />
        </Tooltip>
      ),
    },
    {
      id: 'lastSyncedAt',
      label: t('bot_knowledge_col_synced_at'),
      minWidth: 160,
      render: formatDate,
    },
    {
      id: 'actions',
      label: t('col_actions'),
      width: 150,
      align: 'right',
      render: (_, row) => (
        <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
          <Tooltip title={t('bot_knowledge_sync')}>
            <IconButton size="small" color="primary" disabled={syncingId === row.id || syncingId === 'all'} onClick={() => handleSync(row)}>
              <SyncOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('bot_knowledge_edit')}>
            <IconButton size="small" onClick={() => openEdit(row)}><EditOutlinedIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title={t('bot_knowledge_delete')}>
            <IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}><DeleteOutlineIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ], [syncingId, t]);

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
            {t('bot_knowledge_db_title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
            {t('bot_knowledge_db_subtitle')}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<SyncOutlinedIcon />} disabled={syncingId === 'all'} onClick={handleSyncAll}>
            {t('bot_knowledge_sync_all')}
          </Button>
          <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
            {t('bot_knowledge_import')}
            <input ref={fileInputRef} type="file" hidden accept=".md,.txt" onChange={handleImport} />
          </Button>
          <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={openCreate}>
            {t('bot_knowledge_add')}
          </Button>
        </Stack>
      </Box>

      <AdminSectionPanel title={t('bot_knowledge_db_panel_title')} subtitle={t('bot_knowledge_db_panel_subtitle')}>
        <AdminDataTable
          columns={columns}
          rows={items}
          loading={loading}
          emptyMessage={t('bot_knowledge_empty')}
          compactTable
        />
      </AdminSectionPanel>

      <Dialog open={modal.open} onClose={closeModal} fullWidth maxWidth="lg">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {modal.mode === 'create' ? t('bot_knowledge_add') : t('bot_knowledge_edit')}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label={t('bot_knowledge_field_title')}
            required
            fullWidth
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Stack direction="row" alignItems="center" spacing={1}>
            <Switch checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} />
            <Typography variant="body2">{form.enabled ? t('common:enabled', 'Bật') : t('common:disabled', 'Tắt')}</Typography>
          </Stack>
          <TextField
            label={t('bot_knowledge_field_content')}
            required
            fullWidth
            multiline
            minRows={18}
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button variant="outlined" color="secondary" onClick={closeModal} disabled={saving}>{t('common:cancel', 'Hủy')}</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{t('common:save', 'Lưu')}</Button>
        </DialogActions>
      </Dialog>

      <AdminConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title={t('bot_knowledge_delete_title')}
        description={deleteTarget ? t('bot_knowledge_delete_desc', { title: deleteTarget.title }) : ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  );
};

export default AdminFitBotKnowledgeContent;
