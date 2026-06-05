import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMatch, useNavigate, useParams, useOutletContext } from 'react-router';
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
  Skeleton,
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
import { useAdminUsersContext, useAdminSystemContext } from '../../stores/AdminStore';
import { useAuth } from '../../hooks/useAuth';
import { getLoginHistoryByUser, getUserActivity, resetPasswordByAdmin, adminOrganizationApi } from '../../utils/api';
import { formatDateTime } from '../../utils/dateFormatter';

const AdminUserDetailPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const slugMatchWildcard = useMatch('/:slug/admin/*');
  const slugMatchExact = useMatch('/:slug/admin');
  const slugMatch = slugMatchWildcard ?? slugMatchExact;
  const adminBase = slugMatch?.params?.slug ? `/${slugMatch.params.slug}/admin` : '/admin';
  const { enqueueSnackbar } = useSnackbar();
  const { user: currentUser } = useAuth();
  const { auditLogs } = useAdminSystemContext();
  const { setBreadcrumbs } = useOutletContext();
  const { allUsers, updateUser, deleteUser, banUser, unbanUser } = useAdminUsersContext();
  const user = useMemo(() => allUsers.find((u) => String(u.id) === String(userId)), [allUsers, userId]);

  useEffect(() => {
    if (user) {
      setBreadcrumbs?.([
        { label: 'Người dùng', path: `${adminBase}/users` },
        { label: user.fullName || `@${user.userName}` || `ID: ${user.id}`, active: true },
      ]);
    }
  }, [setBreadcrumbs, user, adminBase]);

  const [tab, setTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [banOpen, setBanOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [organizationOptions, setOrganizationOptions] = useState([]);

  // Fallback: filter global audit logs from context
  const auditTrail = useMemo(
    () =>
      auditLogs.filter(
        (log) =>
          String(log.entityType).toUpperCase() === 'USER' && String(log.entityId) === String(userId),
      ),
    [auditLogs, userId],
  );

  // Per-user login history fetched lazily when tab 5 is opened
  const [userLoginHistory, setUserLoginHistory] = useState(null);
  const [userAdminActions, setUserAdminActions] = useState([]);
  const [userVerificationLogs, setUserVerificationLogs] = useState([]);
  const [userActivitySummary, setUserActivitySummary] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);

  const fetchUserLoginHistory = useCallback(() => {
    if (userLoginHistory !== null || !userId) return;
    setAuditLoading(true);
    getUserActivity(userId)
      .then((res) => {
        const data = res?.data?.data || {};
        const logins = Array.isArray(data.loginHistories) ? data.loginHistories : [];
        const verifications = Array.isArray(data.verificationRequests) ? data.verificationRequests : [];
        const actions = Array.isArray(data.adminActions) ? data.adminActions : [];

        setUserLoginHistory(
          logins.map((entry) => ({
            id: entry.id,
            timestamp: entry.loginAt,
            action: entry.loginMethod ?? 'ĐĂNG NHẬP',
            status: 'SUCCESS',
            description: `Đăng nhập qua ${entry.loginMethod ?? 'mật khẩu'} từ ${entry.loginIp ?? 'không xác định'}`,
            ipAddress: entry.loginIp,
            userAgent: entry.userAgent,
          })),
        );
        setUserVerificationLogs(verifications);
        setUserAdminActions(actions);
        setUserActivitySummary(data?.summary || null);
      })
      .catch(() => {
        getLoginHistoryByUser(userId, 0, 50)
          .then((res) => {
            const items = res?.data?.data?.items ?? [];
            setUserLoginHistory(
              items.map((entry) => ({
                id: entry.id,
                timestamp: entry.loginAt,
                action: entry.loginMethod ?? 'ĐĂNG NHẬP',
                status: 'SUCCESS',
                description: `Đăng nhập qua ${entry.loginMethod ?? 'mật khẩu'} từ ${entry.loginIp ?? 'không xác định'}`,
                ipAddress: entry.loginIp,
                userAgent: entry.userAgent,
              })),
            );
          })
          .catch(() => setUserLoginHistory(auditTrail));
      })
      .finally(() => setAuditLoading(false));
  }, [userId, userLoginHistory, auditTrail]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tab === 5) fetchUserLoginHistory();
  }, [tab, fetchUserLoginHistory]);

  useEffect(() => {
    let active = true;
    const loadOrganizations = async () => {
      try {
        const rows = await adminOrganizationApi.getOrganizations({ page: 0, size: 200 });
        if (!active) return;
        setOrganizationOptions(Array.isArray(rows) ? rows : []);
      } catch {
        if (!active) return;
        setOrganizationOptions([]);
      }
    };
    void loadOrganizations();
    return () => {
      active = false;
    };
  }, []);

  const profile = user
    ? {
        phone: user?.phone || '-',
        dob: user?.dob || '-',
        gender: user?.gender || '-',
        bio: user?.bio || '-',
      }
    : {};
  const academic = Array.isArray(user?.academicRecords) ? user.academicRecords : [];
  const memberships = user ? [{
    organizationName: user?.organizationName || '-',
    verificationLevel: user?.verificationLevel ?? '-',
    status: user?.membershipStatus || '-',
    createdAt: user?.createdAt,
  }] : [];
  const activity = userActivitySummary || {
    postsCreated: user?.postsCreated ?? '-',
    comments: user?.commentsCount ?? '-',
    eventsAttended: user?.eventsAttended ?? '-',
    pageViewsSample: user?.pageViews ?? '-',
  };

  if (!user) {
    return (
      <AdminSectionPanel title="Không tìm thấy người dùng" subtitle="ID này không có trong danh sách hiện tại.">
        <Button startIcon={<ArrowBackOutlinedIcon />} onClick={() => navigate(`${adminBase}/users`)} sx={{ textTransform: 'none' }}>
          Quay lại danh sách
        </Button>
      </AdminSectionPanel>
    );
  }

  return (
    <>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Quay lại">
            <IconButton onClick={() => navigate(`${adminBase}/users`)} color="primary">
              <ArrowBackOutlinedIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Người dùng #{user.id}
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
                Ngày tạo: {formatDateTime(user.createdAt)} · Cập nhật: {formatDateTime(user.updatedAt)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, ml: { md: 'auto' } }}>
              <Button variant="outlined" color="secondary" size="small" onClick={() => setEditOpen(true)} sx={{ textTransform: 'none' }}>
                Sửa thông tin
              </Button>
              <Button
                variant="outlined"
                size="small"
                sx={{ textTransform: 'none' }}
                onClick={async () => {
                  const nextPassword = window.prompt('Nhập mật khẩu tạm thời mới (tối thiểu 8 ký tự):', '');
                  if (!nextPassword) return;
                  if (nextPassword.length < 8) {
                    enqueueSnackbar('Mật khẩu phải có ít nhất 8 ký tự.', { variant: 'warning' });
                    return;
                  }
                  try {
                    await resetPasswordByAdmin(user.id, {
                      newPassword: nextPassword,
                      adminUserId: Number(currentUser?.id),
                      reason: 'Hỗ trợ đặt lại mật khẩu từ trang chi tiết quản trị',
                    });
                    enqueueSnackbar('Đặt lại mật khẩu thành công.', { variant: 'success' });
                  } catch (error) {
                    enqueueSnackbar(error?.response?.data?.message || 'Lỗi khi đặt lại mật khẩu.', {
                      variant: 'error',
                    });
                  }
                }}
              >
                Đặt lại mật khẩu
              </Button>
              {user.status === 'BANNED' ? (
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<LockOpenOutlinedIcon />}
                  onClick={async () => {
                    try {
                      await unbanUser(user.id);
                    } catch {
                      /* snackbar in hook */
                    }
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Bỏ chặn
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="warning"
                  size="small"
                  startIcon={<BlockOutlinedIcon />}
                  onClick={() => setBanOpen(true)}
                  sx={{ textTransform: 'none' }}
                >
                  Chặn
                </Button>
              )}
              <Button variant="contained" color="error" size="small" onClick={() => setDeleteOpen(true)} sx={{ textTransform: 'none' }}>
                Xóa tài khoản
              </Button>
            </Box>
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab label="Thông tin chung" sx={{ textTransform: 'none' }} />
            <Tab label="Học vấn" sx={{ textTransform: 'none' }} />
            <Tab label="Thành viên" sx={{ textTransform: 'none' }} />
            <Tab label="Hoạt động" sx={{ textTransform: 'none' }} />
            <Tab label="Kiểm duyệt" sx={{ textTransform: 'none' }} />
            <Tab label="Hành động / Nhật ký" sx={{ textTransform: 'none' }} />
          </Tabs>
          <Divider />
          <Box sx={{ p: 2 }}>
            {tab === 0 ? (
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>Họ tên:</strong> {user.fullName || '-'}
                </Typography>
                <Typography variant="body2">
                  <strong>Số điện thoại:</strong> {profile.phone}
                </Typography>
                <Typography variant="body2">
                  <strong>Ngày sinh:</strong> {profile.dob}
                </Typography>
                <Typography variant="body2">
                  <strong>Giới tính:</strong> {profile.gender}
                </Typography>
                <Typography variant="body2">
                  <strong>Tiểu sử:</strong> {profile.bio}
                </Typography>
              </Stack>
            ) : null}
            {tab === 1 ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>MSSV</TableCell>
                    <TableCell>Bằng cấp</TableCell>
                    <TableCell>Lớp</TableCell>
                    <TableCell>Bắt đầu</TableCell>
                    <TableCell>Tốt nghiệp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {academic.map((row, idx) => (
                    <TableRow key={`${row.studentCode || row.id || `row-${idx}`}`}>
                      <TableCell>{row.studentCode || '-'}</TableCell>
                      <TableCell>{row.degreeType || '-'}</TableCell>
                      <TableCell>{row.className || '-'}</TableCell>
                      <TableCell>{row.startYear || '-'}</TableCell>
                      <TableCell>{row.graduatedYear || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {academic.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography variant="body2" color="text.secondary">Chưa có thông tin học vấn từ API.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            ) : null}
            {tab === 2 ? (
              <List dense>
                {memberships.map((m) => (
                  <ListItem key={m.organizationName} disablePadding sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={m.organizationName}
                      secondary={`Xác thực: ${m.verificationLevel} · Trạng thái: ${m.status}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : null}
            {tab === 3 ? (
              <Stack spacing={0.5}>
                <Typography variant="body2">Bài viết đã tạo: {activity?.postsCreated ?? '-'}</Typography>
                <Typography variant="body2">Bình luận: {activity?.comments ?? '-'}</Typography>
                <Typography variant="body2">Sự kiện đã tham gia: {activity?.eventsAttended ?? '-'}</Typography>
                <Typography variant="body2">Lượt xem trang: {activity?.pageViewsSample ?? '-'}</Typography>
              </Stack>
            ) : null}
            {tab === 4 ? (
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>Trạng thái tài khoản:</strong> {formatAccountStatusLabel(user.status)}
                </Typography>
                {user.banReason ? (
                  <Typography variant="body2">
                    <strong>Lý do chặn:</strong> {user.banReason}
                  </Typography>
                ) : null}
                {user.bannedUntil ? (
                  <Typography variant="body2">
                    <strong>Bị chặn đến:</strong> {formatDateTime(user.bannedUntil)}
                  </Typography>
                ) : user.status === 'BANNED' ? (
                  <Typography variant="body2">
                    <strong>Bị chặn đến:</strong> Vĩnh viễn
                  </Typography>
                ) : null}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>
                  Lịch sử chặn
                </Typography>
                {(user.banHistory && user.banHistory.length > 0
                  ? user.banHistory
                  : [{ at: user.updatedAt, reason: user.banReason || '—' }]
                ).map((entry, idx) => (
                  <Typography key={`${entry.at}-${idx}`} variant="caption" display="block" color="text.secondary">
                    {formatDateTime(entry.at)} — {entry.reason}
                  </Typography>
                ))}
              </Stack>
            ) : null}
            {tab === 5 ? (
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Lịch sử đăng nhập cho tài khoản này được lấy từ dịch vụ nhật ký.
                </Typography>
                {auditLoading ? (
                  <Stack spacing={1}>
                    <Skeleton variant="rounded" height={36} />
                    <Skeleton variant="rounded" height={36} />
                    <Skeleton variant="rounded" height={36} />
                  </Stack>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Thời gian</TableCell>
                        <TableCell>Hành động</TableCell>
                        <TableCell>Kết quả</TableCell>
                        <TableCell>Mô tả</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(userLoginHistory ?? auditTrail).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4}>
                            <Typography variant="body2" color="text.secondary">
                              Không tìm thấy lịch sử đăng nhập cho người dùng này.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        (userLoginHistory ?? auditTrail).map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>{formatDateTime(log.timestamp)}</TableCell>
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
                )}
                <Button
                  variant="text"
                  onClick={() => navigate(`${adminBase}/audit-logs`)}
                  sx={{ textTransform: 'none', alignSelf: 'flex-start' }}
                >
                  Mở trang nhật ký đầy đủ
                </Button>
                {userVerificationLogs.length > 0 ? (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Yêu cầu xác thực
                    </Typography>
                    <List dense>
                      {userVerificationLogs.map((item, idx) => (
                        <ListItem key={`${item.id || idx}`} disablePadding sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={`#${item.id || '-'} · ${item.status || 'không xác định'}`}
                            secondary={`Loại: ${item.documentType || '-'} · Ngày tạo: ${formatDateTime(item.createdAt)}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                ) : null}
                {userAdminActions.length > 0 ? (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Hành động quản trị
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Thời gian</TableCell>
                          <TableCell>Hành động</TableCell>
                          <TableCell>Đối tượng</TableCell>
                          <TableCell>Trước</TableCell>
                          <TableCell>Sau</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userAdminActions.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                            <TableCell>{item.action || '-'}</TableCell>
                            <TableCell>{`${item.resourceType || '-'} #${item.resourceId || '-'}`}</TableCell>
                            <TableCell>{item.beforeData || '-'}</TableCell>
                            <TableCell>{item.afterData || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                ) : null}
              </Stack>
            ) : null}
          </Box>
        </Paper>
      </Stack>

      <AdminUserFormDialog
        open={editOpen}
        mode="edit"
        user={user}
        organizationOptions={organizationOptions}
        onClose={() => setEditOpen(false)}
        onSubmit={async (payload) => {
          try {
            await updateUser(user.id, payload);
          } catch {
            /* snackbar in hook */
          }
        }}
      />

      <AdminBanUserDialog
        open={banOpen}
        user={user}
        onClose={() => setBanOpen(false)}
        onConfirm={async (payload) => {
          try {
            await banUser(user.id, payload);
            setBanOpen(false);
          } catch {
            /* snackbar in hook */
          }
        }}
      />

      <AdminConfirmDeleteDialog
        open={deleteOpen}
        title="Xóa tài khoản"
        description={`Xóa người dùng ${user.fullName} (#${user.id})?`}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          try {
            await deleteUser(user.id);
            setDeleteOpen(false);
            navigate(`${adminBase}/users`);
          } catch {
            /* snackbar in hook */
          }
        }}
      />
    </>
  );
};

export default AdminUserDetailPage;
