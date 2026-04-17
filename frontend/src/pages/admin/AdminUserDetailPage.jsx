import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useSnackbar } from 'notistack';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import AdminStatusChip from '../../components/admin/AdminStatusChip';
import AdminBanUserDialog from '../../components/admin/AdminBanUserDialog';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import AdminUserFormDialog from '../../components/admin/AdminUserFormDialog';
import { formatAccountStatusLabel } from '../../constants/adminStatusDisplay';
import { useAdminUsersContext } from '../../contexts/AdminUsersContext';
import { useAdminSystemContext } from '../../contexts/AdminSystemContext';

const formatDate = (value) => {
  if (!value) {
    return '-';
  }
  try {
    return new Date(value).toLocaleString('vi-VN');
  } catch {
    return String(value);
  }
};

const demoProfile = (user) => ({
  phone: user?.phone || '0901 234 567',
  dob: user?.dob || '1998-05-15',
  gender: user?.gender || 'MALE',
  bio: user?.bio || 'Alumni demo profile — connect to API for real data.',
});

const demoAcademic = () => [
  {
    studentCode: 'N1900001',
    degreeType: 'BACHELOR',
    className: 'K19',
    startYear: 2019,
    graduatedYear: 2023,
  },
];

const demoMemberships = (user) => [
  {
    organizationName: user?.organizationName || '-',
    verificationLevel: 2,
    status: user?.membershipStatus || 'active',
    createdAt: user?.createdAt,
  },
];

const demoActivity = () => ({
  postsCreated: 12,
  comments: 48,
  eventsAttended: 3,
  pageViewsSample: 120,
});

const AdminUserDetailPage = () => {
  const { userId } = useParams();
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { auditLogs } = useAdminSystemContext();
  const { allUsers, updateUser, deleteUser, banUser, unbanUser } = useAdminUsersContext();

  const user = useMemo(() => allUsers.find((u) => String(u.id) === String(userId)), [allUsers, userId]);

  const [tab, setTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [banOpen, setBanOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const auditTrail = useMemo(
    () =>
      auditLogs.filter(
        (log) =>
          String(log.entityType).toUpperCase() === 'USER' && String(log.entityId) === String(userId),
      ),
    [auditLogs, userId],
  );

  const profile = user ? demoProfile(user) : {};
  const academic = user ? demoAcademic() : [];
  const memberships = user ? demoMemberships(user) : [];
  const activity = user ? demoActivity() : null;

  if (!user) {
    return (
      <AdminSectionPanel title="User not found" subtitle="This id is not in the current list (demo data).">
        <Button startIcon={<ArrowBackOutlinedIcon />} onClick={() => navigate('/admin/users')} sx={{ textTransform: 'none' }}>
          Back to users
        </Button>
      </AdminSectionPanel>
    );
  }

  return (
    <>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Back">
            <IconButton onClick={() => navigate('/admin/users')} color="primary">
              <ArrowBackOutlinedIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            User #{user.id}
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
            <Avatar src={user.avatarUrl || undefined} sx={{ width: 72, height: 72, bgcolor: 'primary.main' }}>
              {(user.fullName || user.userName || '?').slice(0, 1)}
            </Avatar>
            <Box sx={{ flex: '1 1 240px', minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {user.fullName || '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                @{user.userName || '-'} · {user.email || '-'}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, alignItems: 'center' }}>
                <Chip size="small" label={user.role || '-'} color="primary" variant="outlined" />
                <AdminStatusChip status={user.status} category="account" />
              </Box>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                Created: {formatDate(user.createdAt)} · Updated: {formatDate(user.updatedAt)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, ml: { md: 'auto' } }}>
              <Button variant="outlined" size="small" onClick={() => setEditOpen(true)} sx={{ textTransform: 'none' }}>
                Edit info
              </Button>
              {user.status === 'BANNED' ? (
                <Button
                  variant="outlined"
                  color="success"
                  size="small"
                  startIcon={<LockOpenOutlinedIcon />}
                  onClick={() => {
                    unbanUser(user.id);
                    enqueueSnackbar('User unbanned.', { variant: 'success' });
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Unban
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  startIcon={<BlockOutlinedIcon />}
                  onClick={() => setBanOpen(true)}
                  sx={{ textTransform: 'none' }}
                >
                  Ban
                </Button>
              )}
              <Button variant="outlined" size="small" disabled sx={{ textTransform: 'none' }}>
                Reset password
              </Button>
              <Button variant="outlined" color="error" size="small" onClick={() => setDeleteOpen(true)} sx={{ textTransform: 'none' }}>
                Delete account
              </Button>
            </Box>
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab label="General" sx={{ textTransform: 'none' }} />
            <Tab label="Academic records" sx={{ textTransform: 'none' }} />
            <Tab label="Memberships" sx={{ textTransform: 'none' }} />
            <Tab label="Activity" sx={{ textTransform: 'none' }} />
            <Tab label="Moderation" sx={{ textTransform: 'none' }} />
            <Tab label="Actions / Audit" sx={{ textTransform: 'none' }} />
          </Tabs>
          <Divider />
          <Box sx={{ p: 2 }}>
            {tab === 0 ? (
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>Full name:</strong> {user.fullName || '-'}
                </Typography>
                <Typography variant="body2">
                  <strong>Phone:</strong> {profile.phone}
                </Typography>
                <Typography variant="body2">
                  <strong>Date of birth:</strong> {profile.dob}
                </Typography>
                <Typography variant="body2">
                  <strong>Gender:</strong> {profile.gender}
                </Typography>
                <Typography variant="body2">
                  <strong>Bio:</strong> {profile.bio}
                </Typography>
              </Stack>
            ) : null}
            {tab === 1 ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student code</TableCell>
                    <TableCell>Degree</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Start</TableCell>
                    <TableCell>Graduated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {academic.map((row) => (
                    <TableRow key={row.studentCode}>
                      <TableCell>{row.studentCode}</TableCell>
                      <TableCell>{row.degreeType}</TableCell>
                      <TableCell>{row.className}</TableCell>
                      <TableCell>{row.startYear}</TableCell>
                      <TableCell>{row.graduatedYear}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}
            {tab === 2 ? (
              <List dense>
                {memberships.map((m) => (
                  <ListItem key={m.organizationName} disablePadding sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={m.organizationName}
                      secondary={`Verification: ${m.verificationLevel} · Status: ${m.status}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : null}
            {tab === 3 ? (
              <Stack spacing={0.5}>
                <Typography variant="body2">Posts created: {activity?.postsCreated}</Typography>
                <Typography variant="body2">Comments: {activity?.comments}</Typography>
                <Typography variant="body2">Events attended: {activity?.eventsAttended}</Typography>
                <Typography variant="body2">Page views (sample): {activity?.pageViewsSample}</Typography>
              </Stack>
            ) : null}
            {tab === 4 ? (
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>Account status:</strong> {formatAccountStatusLabel(user.status)}
                </Typography>
                {user.banReason ? (
                  <Typography variant="body2">
                    <strong>Ban reason:</strong> {user.banReason}
                  </Typography>
                ) : null}
                {user.bannedUntil ? (
                  <Typography variant="body2">
                    <strong>Banned until:</strong> {formatDate(user.bannedUntil)}
                  </Typography>
                ) : user.status === 'BANNED' ? (
                  <Typography variant="body2">
                    <strong>Banned until:</strong> Permanent
                  </Typography>
                ) : null}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>
                  Ban history
                </Typography>
                {(user.banHistory && user.banHistory.length > 0
                  ? user.banHistory
                  : [{ at: user.updatedAt, reason: user.banReason || '—' }]
                ).map((entry, idx) => (
                  <Typography key={`${entry.at}-${idx}`} variant="caption" display="block" color="text.secondary">
                    {formatDate(entry.at)} — {entry.reason}
                  </Typography>
                ))}
              </Stack>
            ) : null}
            {tab === 5 ? (
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  View consolidated audit entries where the entity is this user account.
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {auditTrail.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <Typography variant="body2" color="text.secondary">
                            No audit entries for this user in the current log set.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditTrail.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{formatDate(log.timestamp)}</TableCell>
                          <TableCell>{log.action}</TableCell>
                          <TableCell>
                            <AdminStatusChip status={log.status} category="audit" />
                          </TableCell>
                          <TableCell>{log.description || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <Button
                  variant="text"
                  onClick={() => navigate('/admin/audit-logs')}
                  sx={{ textTransform: 'none', alignSelf: 'flex-start' }}
                >
                  Open full audit log page
                </Button>
              </Stack>
            ) : null}
          </Box>
        </Paper>
      </Stack>

      <AdminUserFormDialog
        open={editOpen}
        mode="edit"
        user={user}
        onClose={() => setEditOpen(false)}
        onSubmit={(payload) => {
          updateUser(user.id, payload);
          enqueueSnackbar('User updated.', { variant: 'success' });
          setEditOpen(false);
        }}
      />

      <AdminBanUserDialog
        open={banOpen}
        user={user}
        onClose={() => setBanOpen(false)}
        onConfirm={(payload) => {
          banUser(user.id, payload);
          enqueueSnackbar('User banned.', { variant: 'success' });
          setBanOpen(false);
        }}
      />

      <AdminConfirmDeleteDialog
        open={deleteOpen}
        title="Delete account"
        description={`Remove ${user.fullName} (#${user.id})? Demo: local state only.`}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          deleteUser(user.id);
          enqueueSnackbar('User deleted.', { variant: 'success' });
          setDeleteOpen(false);
          navigate('/admin/users');
        }}
      />
    </>
  );
};

export default AdminUserDetailPage;
