import { useMemo, useState } from 'react';
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
  List,
  ListItemButton,
  ListItemText,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import { useAdminForumContext } from '../../contexts/AdminForumContext';
import { useAdminSystemContext } from '../../contexts/AdminSystemContext';

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

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return String(value);
  }
};

const CategoryBranch = ({ node, depth = 0, expanded, toggle, onEdit, onDelete }) => {
  const hasChildren = node.children && node.children.length > 0;
  const open = expanded[node.id];

  return (
    <Box sx={{ pl: depth * 2 }}>
      <ListItemButton dense onClick={() => hasChildren && toggle(node.id)} sx={{ borderRadius: 1 }}>
        {hasChildren ? (
          <IconButton size="small" edge="start" sx={{ mr: 0.5 }}>
            {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        ) : (
          <Box sx={{ width: 32 }} />
        )}
        <ListItemText
          primary={
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {node.name}
            </Typography>
          }
          secondary={
            [
              node.description,
              node.organizationId ? `Org #${node.organizationId}` : null,
              node.createdAt ? `Created: ${formatDate(node.createdAt)}` : null,
              node.updatedAt ? `Updated: ${formatDate(node.updatedAt)}` : null,
            ]
              .filter(Boolean)
              .join(' · ') || '-'
          }
        />
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Edit">
            <Button
              size="small"
              startIcon={<EditOutlinedIcon />}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(node);
              }}
              sx={{ textTransform: 'none' }}
            >
              Edit
            </Button>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node);
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </ListItemButton>
      {hasChildren ? (
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
      ) : null}
    </Box>
  );
};

const AdminForumCategoriesPage = () => {
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
  const [form, setForm] = useState({ name: '', description: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Auto-expand root on first load
  useMemo(() => {
    if (tree.length > 0 && Object.keys(expanded).length === 0) {
      const init = {};
      tree.forEach((n) => { init[n.id] = true; });
      setExpanded(init);
    }
  }, [tree]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateRoot = () => {
    setForm({ name: '', description: '' });
    setModal({ open: true, mode: 'create', node: null });
  };

  const openEdit = (node) => {
    setForm({
      name: node.name,
      description: node.description || '',
    });
    setModal({ open: true, mode: 'edit', node });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      enqueueSnackbar('Name is required.', { variant: 'warning' });
      return;
    }
    if (modal.mode === 'create') {
      if (!activeOrgId) {
        enqueueSnackbar('No organization selected.', { variant: 'warning' });
        return;
      }
      const ok = await createCategory?.(activeOrgId, form.name, form.description);
      enqueueSnackbar(ok ? 'Category created.' : 'Failed to create category.', {
        variant: ok ? 'success' : 'error',
      });
    } else {
      const ok = await updateCategory?.(modal.node.id, form.name, form.description);
      enqueueSnackbar(ok ? 'Category updated.' : 'Failed to update category.', {
        variant: ok ? 'success' : 'error',
      });
    }
    setModal({ open: false, mode: 'create', node: null });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteCategory?.(deleteTarget.id);
    enqueueSnackbar(ok ? 'Category deleted.' : 'Failed to delete category.', {
      variant: ok ? 'success' : 'error',
    });
    setDeleteTarget(null);
  };

  return (
    <>
      <AdminSectionPanel
        title="Forum categories"
        subtitle={`Manage categories via real API${activeOrgId ? ` (Org #${activeOrgId})` : ''}. Create, edit, and delete categories.`}
        action={
          <Button
            variant="contained"
            size="small"
            startIcon={<AddOutlinedIcon />}
            onClick={openCreateRoot}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Add category
          </Button>
        }
      >
        {categoriesLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Skeleton variant="rounded" height={36} />
            <Skeleton variant="rounded" height={36} />
            <Skeleton variant="rounded" height={36} />
          </Box>
        ) : (
          <PaperLike>
            {tree.length === 0 ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No categories found{activeOrgId ? ` for Org #${activeOrgId}` : ''}. Create one to get started.
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {tree.map((root) => (
                  <CategoryBranch
                    key={root.id}
                    node={root}
                    expanded={expanded}
                    toggle={toggle}
                    onEdit={openEdit}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </List>
            )}
          </PaperLike>
        )}
      </AdminSectionPanel>

      {/* ─── Create / Edit dialog ─── */}
      <Dialog open={modal.open} onClose={() => setModal((m) => ({ ...m, open: false }))} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {modal.mode === 'create' ? 'Create category' : 'Edit category'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            fullWidth
            multiline
            minRows={2}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModal((m) => ({ ...m, open: false }))} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete confirm ─── */}
      <AdminConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete category"
        description={
          deleteTarget
            ? `Delete category "${deleteTarget.name}" (ID: ${deleteTarget.id})? This calls the backend API and cannot be undone.`
            : ''
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
};

const PaperLike = ({ children }) => (
  <Box
    sx={{
      border: 1,
      borderColor: 'divider',
      borderRadius: 2,
      overflow: 'hidden',
      bgcolor: 'background.paper',
    }}
  >
    {children}
  </Box>
);

export default AdminForumCategoriesPage;
