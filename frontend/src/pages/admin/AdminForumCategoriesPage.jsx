import { useState } from 'react';
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
  TextField,
  Typography,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import { DEFAULT_FORUM_CATEGORY_TREE } from '../../constants/adminDefaultForumCategories';

const CategoryBranch = ({ node, depth = 0, expanded, toggle, onEdit }) => {
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
          secondary={`${node.description || ''} · Topics: ${node.topicsCount ?? 0}`}
        />
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
              />
            ))}
          </List>
        </Collapse>
      ) : null}
    </Box>
  );
};

const AdminForumCategoriesPage = () => {
  const [tree] = useState(() => JSON.parse(JSON.stringify(DEFAULT_FORUM_CATEGORY_TREE)));
  const [expanded, setExpanded] = useState(() =>
    tree.reduce((acc, n) => ({ ...acc, [n.id]: true }), {}),
  );
  const [modal, setModal] = useState({ open: false, mode: 'create', node: null, parentId: null });
  const [form, setForm] = useState({ name: '', description: '', ordering: 1 });

  const toggle = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateRoot = () => {
    setForm({ name: '', description: '', ordering: 1 });
    setModal({ open: true, mode: 'create', node: null, parentId: null });
  };

  const openEdit = (node) => {
    setForm({
      name: node.name,
      description: node.description || '',
      ordering: node.ordering ?? 1,
    });
    setModal({ open: true, mode: 'edit', node, parentId: null });
  };

  return (
    <>
      <AdminSectionPanel
        title="Forum categories"
        subtitle="Tree view with expand/collapse and create/edit modal (design §3.3 — persistence is demo-only)."
        action={
          <Button
            variant="contained"
            size="small"
            startIcon={<AddOutlinedIcon />}
            onClick={openCreateRoot}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Add root
          </Button>
        }
      >
        <PaperLike>
          <List disablePadding>
            {tree.map((root) => (
              <CategoryBranch key={root.id} node={root} expanded={expanded} toggle={toggle} onEdit={openEdit} />
            ))}
          </List>
        </PaperLike>
      </AdminSectionPanel>

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
          <TextField
            label="Ordering"
            type="number"
            value={form.ordering}
            onChange={(e) => setForm((f) => ({ ...f, ordering: Number(e.target.value) }))}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Typography variant="caption" color="text.secondary">
            Parent selection and drag-reorder can be wired when the admin category API is available.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModal((m) => ({ ...m, open: false }))} sx={{ textTransform: 'none' }}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => setModal((m) => ({ ...m, open: false }))}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Save (demo)
          </Button>
        </DialogActions>
      </Dialog>
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
