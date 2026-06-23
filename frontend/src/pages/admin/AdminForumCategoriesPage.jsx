import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useOutletContext } from 'react-router';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import SubtitlesOutlinedIcon from '@mui/icons-material/SubtitlesOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined';

import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import AdminDashboardMetricTile from '../../components/admin/AdminDashboardMetricTile';
import { useAdminForumContext, useAdminSystemContext } from '../../stores/AdminStore';
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

const CategoryBranch = ({ node, depth = 0, expanded, toggle, onEdit, onDelete, activeOrganization }) => {
  const theme = useTheme();
  const { t } = useTranslation(['admin']);
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
              {node.description || t('admin:no_description')}
            </Typography>
          }
        />
        <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
          <Tooltip title={t('admin:view_on_forum')}>
            <IconButton
              size="small"
              onClick={() => {
                const slug = activeOrganization?.slug;
                if (slug) {
                  window.open(`/${slug}/forum`, "_blank");
                }
              }}
            >
              <LaunchOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('admin:edit')}>
            <IconButton size="small" onClick={() => onEdit(node)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('admin:delete')}>
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
                activeOrganization={activeOrganization}
              />
            ))}
          </List>
        </Collapse>
      )}
    </Box>
  );
};

const AdminForumCategoriesPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation(['admin']);
  const { stableOrgId, activeOrganization } = useAdminSystemContext();
  const {
    categories,
    categoriesLoading,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useAdminForumContext();

  const { setBreadcrumbs } = useOutletContext();

  useEffect(() => {
    setBreadcrumbs?.([{ label: t('admin:forum_cat_breadcrumb'), active: true }]);
  }, [setBreadcrumbs]);

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
      enqueueSnackbar(t('admin:forum_cat_name_required'), { variant: 'warning' });
      return;
    }
    if (modal.mode === 'create') {
      const ok = await createCategory?.(
        stableOrgId,
        form.name,
        form.description,
        form.parentId === '' ? null : Number(form.parentId),
      );
      enqueueSnackbar(ok ? t('admin:forum_cat_created') : t('admin:forum_cat_create_failed'), { variant: ok ? 'success' : 'error' });
    } else {
      const ok = await updateCategory?.(
        modal.node.id,
        form.name,
        form.description,
        form.parentId === '' ? null : Number(form.parentId),
      );
      enqueueSnackbar(ok ? t('admin:forum_cat_updated') : t('admin:forum_cat_update_failed'), { variant: ok ? 'success' : 'error' });
    }
    setModal({ open: false, mode: 'create', node: null });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteCategory?.(deleteTarget.id);
    enqueueSnackbar(ok ? t('admin:forum_cat_deleted') : t('admin:forum_cat_delete_failed'), { variant: ok ? 'success' : 'error' });
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
          <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
            {t('admin:forum_cat_heading')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
            {t('admin:forum_cat_subtitle')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          onClick={openCreateRoot}
        >
          {t('admin:forum_cat_add')}
        </Button>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          mb: 4,
          '& > *': {
            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 0' },
          },
        }}
      >
        <AdminDashboardMetricTile
          label={t('admin:forum_cat_total')}
          value={stats.total}
          icon={<CategoryOutlinedIcon />}
        />
        <AdminDashboardMetricTile
          label={t('admin:forum_cat_main')}
          value={stats.roots}
          icon={<AccountTreeOutlinedIcon />}
          valueColor="info.main"
        />
        <AdminDashboardMetricTile
          label={t('admin:forum_cat_sub')}
          value={stats.sub}
          icon={<SubtitlesOutlinedIcon />}
          valueColor="success.main"
        />
        <AdminDashboardMetricTile
          label={t('admin:forum_cat_last_updated')}
          value={stats.lastUpdate}
          icon={<HistoryOutlinedIcon />}
          valueColor="warning.main"
        />
      </Box>

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, border: 1, borderColor: 'divider', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <Box sx={{ display: 'flex', bgcolor: (t) => t.palette.mode === 'light' ? 'primary.main' : 'primary.dark', px: 2, py: 2 }}>
          <Typography sx={{ flex: 1, fontWeight: 700, color: 'primary.contrastText', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, pl: 6 }}>
            {t('admin:forum_cat_name_col')}
          </Typography>
          <Typography sx={{ width: 120, fontWeight: 700, color: 'primary.contrastText', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right', pr: 1 }}>
            {t('admin:actions')}
          </Typography>
        </Box>
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
                  {t('admin:forum_cat_empty')}
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
                  activeOrganization={activeOrganization}
                />
              ))
            )}
          </List>
        )}
      </Box>

      {/* Create / Edit Dialog */}
      <Dialog open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {modal.mode === 'create' ? t('admin:forum_cat_create_title') : t('admin:forum_cat_edit_title')}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1, overflow: 'visible', }} >
          <TextField
            label={t('admin:forum_cat_name_field')}
            required
            fullWidth
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label={t('admin:forum_cat_description_field')}
            fullWidth
            multiline
            minRows={2}
            value={form.description}
            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            select
            label={t('admin:forum_cat_parent_field')}
            fullWidth
            value={form.parentId}
            onChange={(e) => setForm(f => ({ ...f, parentId: e.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">{t('admin:forum_cat_no_parent')}</MenuItem>
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
          <Button variant="outlined" color="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>
            {t('admin:cancel')}
          </Button>
          <Button variant="contained" onClick={handleSave}>
            {t('admin:save')}
          </Button>
        </DialogActions>
      </Dialog>

      <AdminConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title={t('admin:forum_cat_delete_title')}
        description={deleteTarget ? t('admin:forum_cat_delete_confirm', { name: deleteTarget.name, id: deleteTarget.id }) : ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
};

export default AdminForumCategoriesPage;
