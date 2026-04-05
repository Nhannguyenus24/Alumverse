import { useMemo, useState } from 'react';
import {
  Box,
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
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import { DEFAULT_FORUM_TOPICS } from '../../constants/adminDefaultForumTopics';

const formatDate = (value) => {
  if (!value) {
    return '-';
  }
  try {
    return new Date(value).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return String(value);
  }
};

const AdminForumTopicsPage = () => {
  const [topics] = useState(() => DEFAULT_FORUM_TOPICS.map((t) => ({ ...t })));
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filtered = useMemo(() => {
    let list = topics;
    if (statusFilter === 'ACTIVE') {
      list = list.filter((t) => t.isActive);
    } else if (statusFilter === 'INACTIVE') {
      list = list.filter((t) => !t.isActive);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((t) => String(t.title || '').toLowerCase().includes(q));
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortBy === 'viewCount') {
        return (b.viewCount || 0) - (a.viewCount || 0);
      }
      if (sortBy === 'postCount') {
        return (b.postCount || 0) - (a.postCount || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return sorted;
  }, [topics, statusFilter, search, sortBy]);

  const paged = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  return (
    <AdminSectionPanel
      title="Forum topics management"
      subtitle="Filter, sort, and review topics (design §3.2 — row actions are demo placeholders)."
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <TextField
          size="small"
          label="Search title"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          sx={{ flex: '1 1 220px', minWidth: 200 }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="ALL">All</MenuItem>
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="INACTIVE">Inactive</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Sort by"
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="createdAt">Creation date</MenuItem>
          <MenuItem value="viewCount">Views</MenuItem>
          <MenuItem value="postCount">Post count</MenuItem>
        </TextField>
      </Box>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Creator</TableCell>
            <TableCell>Posts</TableCell>
            <TableCell>Views</TableCell>
            <TableCell>Active</TableCell>
            <TableCell>Created</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paged.map((topic) => (
            <TableRow key={topic.id} hover>
              <TableCell>{topic.id}</TableCell>
              <TableCell sx={{ maxWidth: 220 }}>{topic.title}</TableCell>
              <TableCell>{topic.categoryName}</TableCell>
              <TableCell>{topic.createdByName}</TableCell>
              <TableCell>{topic.postCount}</TableCell>
              <TableCell>{topic.viewCount}</TableCell>
              <TableCell>{topic.isActive ? 'Yes' : 'No'}</TableCell>
              <TableCell>{formatDate(topic.createdAt)}</TableCell>
              <TableCell align="right">
                <Tooltip title="View (demo)">
                  <IconButton size="small" color="primary">
                    <VisibilityOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(Number(e.target.value));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 20]}
      />
    </AdminSectionPanel>
  );
};

export default AdminForumTopicsPage;
