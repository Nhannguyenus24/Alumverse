import { useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  List,
  ListItemButton,
  ListItemText,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
  Stack,
  alpha,
  useTheme,
  Grid,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import SubtitlesOutlinedIcon from '@mui/icons-material/SubtitlesOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';

import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import AdminDashboardMetricTile from '../../components/admin/AdminDashboardMetricTile';
import { useAdminForumContext } from '../../contexts/AdminForumContext';
import { useAdminSystemContext } from '../../contexts/AdminSystemContext';
import { formatDate } from '../../utils/dateFormatter';

/* ─── Build tree from flat list ─── */
const buildTree = (flatList) => {
  if (!Array.isArray(flatList) || flatList.length === 0) return [];
  const map = {};
  const roots = [];
  flatList.forEach((cat) => {
    map[cat.id] = { ...cat, children: [] };
  });
  flatList.forEach((cat) => {
    if (cat.parentId && map[cat.parentId]) {
      map[cat.parentId].children.push(map[cat.id]);
    } else {
      roots.push(map[cat.id]);
    }
  });
  return roots;
};

const CategoryBranch = ({ node, depth = 0, expanded, toggle, onEdit, onDelete }) => {
  const theme = useTheme();
  const hasChildren = node.children && node.children.length > 0;
  const open = expanded[node.id];

  return (
    <Box sx={{ pl: depth * 2.5 }}>
      <ListItemButton 
        onClick={() => hasChildren && toggle(node.id)} 
        sx={{ 
          borderRadius: 2, 
          mb: 0.5,
          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
        }}
      >
        {hasChildren ? (
          <IconButton size="small" edge="start" sx={{ mr: 1, color: 'primary.main' }}>
            {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        ) : (
          <Box sx={{ width: 36 }} />
        )}
        <ListItemText
          primary={
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {node.name}
            </Typography>
          }
          secondary={
            <Typography variant="caption" color="text.secondary">
              {node.description || 'Không có mô tả'}
            </Typography>
          }
        />
        <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Chỉnh sửa">
            <IconButton size="small" onClick={() => onEdit(node)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xóa">
            <IconButton size="small" color="error" onClick={() => onDelete(node)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </ListItemButton>
      {hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List disablePadding>
            {node.children.map((child) => (
              <CategoryBranch
                key={child.id}
                node={child}
                depth={depth + 1}
                expanded={expanded}
                toggle={toggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </List>
        </Collapse>
      )}
    </Box>
  );
};

const AdminForumCategoriesPage = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { activeOrgId } = useAdminSystemContext();
  const {
    categories,
    categoriesLoading,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useAdminForumContext();

  const tree = useMemo(() => buildTree(categories), [categories]);

  const [expanded, setExpanded] = useState({});
  const [modal, setModal] = useState({ open: false, mode: 'create', node: null });
  const [form, setForm] = useState({ name: '', description: '', parentId: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (tree.length > 0 && Object.keys(expanded).length === 0) {
      const init = {};
      tree.forEach((n) => { init[n.id] = true; });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpanded(init);
    }
  }, [tree]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateRoot = () => {
    setForm({ name: '', description: '', parentId: '' });
    setModal({ open: true, mode: 'create', node: null });
  };

  const openEdit = (node) => {
    setForm({
      name: node.name,
      description: node.description || '',
      parentId: node.parentId ?? '',
    });
    setModal({ open: true, mode: 'edit', node });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      enqueueSnackbar('Vui lòng nhập tên danh mục.', { variant: 'warning' });
      return;
    }
    if (modal.mode === 'create') {
      const ok = await createCategory?.(
        activeOrgId,
        form.name,
        form.description,
        form.parentId === '' ? null : Number(form.parentId),
      );
      enqueueSnackbar(ok ? 'Đã tạo danh mục.' : 'Lỗi tạo danh mục.', { variant: ok ? 'success' : 'error' });
    } else {
      const ok = await updateCategory?.(
        modal.node.id,
        form.name,
        form.description,
        form.parentId === '' ? null : Number(form.parentId),
      );
      enqueueSnackbar(ok ? 'Đã cập nhật danh mục.' : 'Lỗi cập nhật.', { variant: ok ? 'success' : 'error' });
    }
    setModal({ open: false, mode: 'create', node: null });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteCategory?.(deleteTarget.id);
    enqueueSnackbar(ok ? 'Đã xóa danh mục.' : 'Lỗi xóa.', { variant: ok ? 'success' : 'error' });
    setDeleteTarget(null);
  };

  const stats = {
    total: categories?.length || 0,
    roots: tree.length,
    sub: (categories?.length || 0) - tree.length,
    lastUpdate: categories?.[0]?.updatedAt ? formatDate(categories[0].updatedAt) : 'N/A'
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -1 }}>
            Danh mục diễn đàn
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
            Cấu trúc phân cấp diễn đàn, quản lý các chuyên mục chính và chuyên mục con.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          onClick={openCreateRoot}
          sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
        >
          Thêm danh mục
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <AdminDashboardMetricTile
            label="Tổng danh mục"
            value={stats.total}
            icon={<CategoryOutlinedIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AdminDashboardMetricTile
            label="Danh mục chính"
            value={stats.roots}
            icon={<AccountTreeOutlinedIcon />}
            valueColor="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AdminDashboardMetricTile
            label="Danh mục con"
            value={stats.sub}
            icon={<SubtitlesOutlinedIcon />}
            valueColor="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AdminDashboardMetricTile
            label="Cập nhật gần nhất"
            value={stats.lastUpdate}
            icon={<HistoryOutlinedIcon />}
            valueColor="warning.main"
          />
        </Grid>
      </Grid>

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, border: 1, borderColor: 'divider', overflow: 'hidden' }}>
        {categoriesLoading ? (
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Skeleton variant="rounded" height={60} />
            <Skeleton variant="rounded" height={60} />
            <Skeleton variant="rounded" height={60} />
          </Box>
        ) : (
          <List sx={{ p: 2 }}>
            {tree.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Chưa có danh mục nào. Hãy tạo danh mục đầu tiên.
                </Typography>
              </Box>
            ) : (
              tree.map((root) => (
                <CategoryBranch
                  key={root.id}
                  node={root}
                  expanded={expanded}
                  toggle={toggle}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                />
              ))
            )}
          </List>
        )}
      </Box>

      {/* Create / Edit Dialog */}
      <Dialog open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {modal.mode === 'create' ? 'Tạo danh mục mới' : 'Chỉnh sửa danh mục'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Tên danh mục"
            required
            fullWidth
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Mô tả"
            fullWidth
            multiline
            minRows={2}
            value={form.description}
            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            select
            label="Danh mục cha"
            fullWidth
            value={form.parentId}
            onChange={(e) => setForm(f => ({ ...f, parentId: e.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Không có (Danh mục gốc)</MenuItem>
            {(categories ?? [])
              .filter(cat => !modal.node || cat.id !== modal.node.id)
              .map(cat => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setModal(m => ({ ...m, open: false }))}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} sx={{ borderRadius: 2 }}>Lưu</Button>
        </DialogActions>
      </Dialog>

      <AdminConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Xóa danh mục"
        description={deleteTarget ? `Xóa danh mục "${deleteTarget.name}" (ID: ${deleteTarget.id})? Hành động này không thể hoàn tác.` : ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
};

export default AdminForumCategoriesPage;
