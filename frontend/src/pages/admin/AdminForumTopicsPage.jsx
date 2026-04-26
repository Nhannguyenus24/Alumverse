import { useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import { useAdminForumContext } from '../../contexts/AdminForumContext';
import { useAdminSystemContext } from '../../contexts/AdminSystemContext';
import { formatDate } from '../../utils/dateFormatter';

const AdminForumTopicsPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { activeOrgId } = useAdminSystemContext();
  const {
    topics: topicsPaginated,
    topicsPage,
    setTopicsPage,
    topicsSize,
    setTopicsSize,
    topicsLoading,
    categories,
    createTopic,
    updateTopic,
    deleteTopic,
  } = useAdminForumContext();

  const topicsList = useMemo(() => {
    if (!topicsPaginated) return [];
    if (Array.isArray(topicsPaginated)) return topicsPaginated;
    return topicsPaginated.content ?? [];
  }, [topicsPaginated]);

  const totalElements = topicsPaginated?.totalElements ?? topicsList.length;

  const [search, setSearch] = useState('');
  const [detailTopic, setDetailTopic] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Create/Edit dialog
  const [dialog, setDialog] = useState({ open: false, mode: 'create', topic: null });
  const [form, setForm] = useState({ title: '', categoryId: '' });

  const filteredTopics = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return topicsList;
    return topicsList.filter((t) => String(t.title || '').toLowerCase().includes(q));
  }, [topicsList, search]);

  const openCreate = () => {
    setForm({ title: '', categoryId: categories?.[0]?.id || '' });
    setDialog({ open: true, mode: 'create', topic: null });
  };

  const openEdit = (topic) => {
    setForm({ title: topic.title || '', categoryId: topic.categoryId || '' });
    setDialog({ open: true, mode: 'edit', topic });
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      enqueueSnackbar('Title is required.', { variant: 'warning' });
      return;
    }
    if (dialog.mode === 'create') {
      if (!activeOrgId) {
        enqueueSnackbar('No organization selected.', { variant: 'warning' });
        return;
      }
      const ok = await createTopic?.(activeOrgId, form.categoryId, form.title, null);
      enqueueSnackbar(ok ? 'Topic created.' : 'Failed to create topic.', { variant: ok ? 'success' : 'error' });
    } else {
      const ok = await updateTopic?.(dialog.topic.id, form.title, form.categoryId);
      enqueueSnackbar(ok ? 'Topic updated.' : 'Failed to update topic.', { variant: ok ? 'success' : 'error' });
    }
    setDialog({ open: false, mode: 'create', topic: null });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteTopic?.(deleteTarget.id);
    enqueueSnackbar(ok ? 'Topic deleted.' : 'Failed to delete topic.', { variant: ok ? 'success' : 'error' });
    setDeleteTarget(null);
  };

  return (
    <>
      <AdminSectionPanel
        title="Forum topics management"
        subtitle={`Manage topics via real API${activeOrgId ? ` (Org #${activeOrgId})` : ''}. Create, edit, and delete topics with server-side pagination.`}
        action={
          <Button
            variant="contained"
            size="small"
            startIcon={<AddOutlinedIcon />}
            onClick={openCreate}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Create topic
          </Button>
        }
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <TextField
            size="small"
            label="Search title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: '1 1 220px', minWidth: 200 }}
          />
        </Box>

        {topicsLoading ? (
          <Typography color="text.secondary" sx={{ py: 2 }}>
            Loading topics…
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Category ID</TableCell>
                <TableCell>Org ID</TableCell>
                <TableCell>Creator</TableCell>
                <TableCell>Views</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTopics.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No topics found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTopics.map((topic) => (
                  <TableRow key={topic.id} hover>
                    <TableCell>{topic.id}</TableCell>
                    <TableCell sx={{ maxWidth: 220 }}>{topic.title}</TableCell>
                    <TableCell>{topic.categoryId ?? '-'}</TableCell>
                    <TableCell>{topic.organizationId ?? '-'}</TableCell>
                    <TableCell>{topic.createdByName || topic.createdByMemberId || '-'}</TableCell>
                    <TableCell>{topic.viewCount ?? 0}</TableCell>
                    <TableCell>{formatDate(topic.createdAt)}</TableCell>
                    <TableCell>{formatDate(topic.updatedAt)}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => setDetailTopic(topic)}
                          >
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" color="info" onClick={() => openEdit(topic)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteTarget(topic)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        <TablePagination
          component="div"
          count={totalElements}
          page={topicsPage ?? 0}
          rowsPerPage={topicsSize ?? 10}
          onPageChange={(_, p) => setTopicsPage?.(p)}
          onRowsPerPageChange={(e) => {
            setTopicsSize?.(Number(e.target.value));
            setTopicsPage?.(0);
          }}
          rowsPerPageOptions={[10, 20]}
        />
      </AdminSectionPanel>

      {/* ─── Detail dialog ─── */}
      <Dialog
        open={Boolean(detailTopic)}
        onClose={() => setDetailTopic(null)}
        fullWidth
        maxWidth="sm"
        scroll="body"
      >
        <DialogTitle sx={{ color: 'primary.main', fontWeight: 700 }}>Topic detail</DialogTitle>
        {detailTopic && (
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="body2"><strong>ID:</strong> {detailTopic.id}</Typography>
            <Typography variant="body2"><strong>Title:</strong> {detailTopic.title}</Typography>
            <Typography variant="body2"><strong>Category ID:</strong> {detailTopic.categoryId ?? '-'}</Typography>
            <Typography variant="body2"><strong>Organization ID:</strong> {detailTopic.organizationId ?? '-'}</Typography>
            <Typography variant="body2"><strong>Created by:</strong> {detailTopic.createdByName || detailTopic.createdByMemberId || '-'}</Typography>
            <Typography variant="body2"><strong>Views:</strong> {detailTopic.viewCount ?? 0}</Typography>
            <Typography variant="body2"><strong>Created:</strong> {formatDate(detailTopic.createdAt)}</Typography>
            <Typography variant="body2"><strong>Updated:</strong> {formatDate(detailTopic.updatedAt)}</Typography>
          </DialogContent>
        )}
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDetailTopic(null)} variant="contained" sx={{ textTransform: 'none', fontWeight: 700 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Create/Edit dialog ─── */}
      <Dialog
        open={dialog.open}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {dialog.mode === 'create' ? 'Create topic' : 'Edit topic'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Title"
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            select
            label="Category"
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          >
            {(categories ?? []).length === 0 ? (
              <MenuItem value="">No categories loaded</MenuItem>
            ) : (
              (categories ?? []).map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name || `Category #${cat.id}`}
                </MenuItem>
              ))
            )}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialog((d) => ({ ...d, open: false }))} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete confirm ─── */}
      <AdminConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete topic"
        description={deleteTarget ? `Delete topic "${deleteTarget.title}" (ID: ${deleteTarget.id})? This calls the backend API.` : ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default AdminForumTopicsPage;
