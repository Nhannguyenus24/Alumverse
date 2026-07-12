import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMatch, useNavigate, useParams, useOutletContext } from 'react-router';


import { formatAccountStatusLabel } from '../../constants/adminStatusDisplay';
import { useAdminUsersContext } from '../../stores/AdminStore';
import useAdminAuditLogsData from '../../hooks/admin/useAdminAuditLogsData';
import { getLoginHistoryByUser, getUserActivity, adminOrganizationApi } from '../../utils/api';
import { formatDateTime } from '../../utils/dateFormatter';

const formatEnumText = (value) => {
  if (value == null || value === '') return '-';
  return String(value)
    .replace(/_/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getDisplayStatus = (user) => {
  const accountStatus = String(user?.status || '').toUpperCase();
  if (accountStatus && accountStatus !== 'ACTIVE') return accountStatus;

  if (user?.verificationLevel === null || user?.verificationLevel === undefined) {
    return accountStatus || 'UNKNOWN';
  }
  const level = Number(user.verificationLevel);
  if (!Number.isFinite(level)) return accountStatus || 'UNKNOWN';
  if (level >= 2) return 'ACTIVE';
  if (level === 1) return 'VERIFYING';
  return 'UNVERIFIED';
};

const formatDisplayStatusLabel = (user, t) => {
  const status = getDisplayStatus(user);
  if (status === 'VERIFYING') return t('status_verifying', { defaultValue: 'Verifying' });
  return formatAccountStatusLabel(status, t);
};

const AdminUserDetailPage = () => {
  const { t } = useTranslation('admin');
  const { userId } = useParams();
  const navigate = useNavigate();
  const slugMatchWildcard = useMatch('/:slug/admin/*');
  const slugMatchExact = useMatch('/:slug/admin');
  const slugMatch = slugMatchWildcard ?? slugMatchExact;
  const adminBase = slugMatch?.params?.slug ? `/${slugMatch.params.slug}/admin` : '/admin';
  const { auditLogs } = useAdminAuditLogsData();
  const { setBreadcrumbs } = useOutletContext();
  const { allUsers, updateUser, deleteUser, banUser, unbanUser } = useAdminUsersContext();
  const user = useMemo(() => allUsers.find((u) => String(u.id) === String(userId)), [allUsers, userId]);

  useEffect(() => {
    if (user) {
      setBreadcrumbs?.([
        { label: t('breadcrumb_users'), path: `${adminBase}/users` },
        { label: user.fullName || `ID: ${user.studentId}` || `ID: ${user.id}`, active: true },
      ]);
    }
  }, [setBreadcrumbs, user, adminBase, t]);

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
            action: entry.loginMethod ?? t('user_detail_login_action_default'),
            status: 'SUCCESS',
            description: t('user_detail_login_desc', { method: entry.loginMethod ?? t('user_detail_login_method_default'), ip: entry.loginIp ?? t('user_detail_ip_unknown') }),
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
                action: entry.loginMethod ?? t('user_detail_login_action_default'),
                status: 'SUCCESS',
                description: t('user_detail_login_desc', { method: entry.loginMethod ?? t('user_detail_login_method_default'), ip: entry.loginIp ?? t('user_detail_ip_unknown') }),
                ipAddress: entry.loginIp,
                userAgent: entry.userAgent,
              })),
            );
          })
          .catch(() => setUserLoginHistory(auditTrail));
      })
      .finally(() => setAuditLoading(false));
  }, [userId, userLoginHistory, auditTrail, t]);

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
  const displayStatus = getDisplayStatus(user);
  const activity = userActivitySummary || {
    postsCreated: user?.postsCreated ?? '-',
    comments: user?.commentsCount ?? '-',
    eventsAttended: user?.eventsAttended ?? '-',
    pageViewsSample: user?.pageViews ?? '-',
  };

  if (!user) {
    return (
      <AdminSectionPanel title={t('user_detail_not_found')} subtitle={t('user_detail_not_found_subtitle')}>
        <Button startIcon={<ArrowBackOutlinedIcon />} onClick={() => navigate(`${adminBase}/users`)} sx={{ textTransform: 'none' }}>
          {t('user_detail_back_to_list')}
        </Button>
      </AdminSectionPanel>
    );
  }

  return (
    <>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={t('user_detail_go_back')}>
            <IconButton onClick={() => navigate(`${adminBase}/users`)} color="primary">
              <ArrowBackOutlinedIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {`${t('user_detail_user_label')} #${user.id}`}
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
            <Avatar src={user.avatarUrl || undefined} sx={{ width: 72, height: 72, bgcolor: 'primary.main' }}>
              {(user.fullName || user.studentId || '?').slice(0, 1)}
            </Avatar>
            <Box sx={{ flex: '1 1 240px', minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {user.fullName || '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ID: {user.studentId || '-'} · {user.email || '-'}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, alignItems: 'center' }}>
                <Chip size="small" label={user.role || '-'} color="primary" variant="outlined" />
                <AdminStatusChip
                  status={displayStatus}
                  category="account"
                  label={formatDisplayStatusLabel(user, t)}
                />
              </Box>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                {t('user_detail_created_at')}: {formatDateTime(user.createdAt)} · {t('user_detail_updated_at')}: {formatDateTime(user.updatedAt)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, ml: { md: 'auto' } }}>
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                startIcon={<EditOutlinedIcon />}
                onClick={() => setEditOpen(true)}
                sx={{ textTransform: 'none' }}
              >
                {t('user_detail_edit_info')}
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
                  {t('unban')}
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
                  {t('ban')}
                </Button>
              )}
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<DeleteOutlineIcon />}
                onClick={() => setDeleteOpen(true)}
                sx={{ textTransform: 'none' }}
              >
                {t('user_detail_delete_account')}
              </Button>
            </Box>
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab label={t('user_detail_tab_general')} sx={{ textTransform: 'none' }} />
            <Tab label={t('user_detail_tab_academic')} sx={{ textTransform: 'none' }} />
            <Tab label={t('user_detail_tab_membership')} sx={{ textTransform: 'none' }} />
            <Tab label={t('user_detail_tab_activity')} sx={{ textTransform: 'none' }} />
            <Tab label={t('user_detail_tab_moderation')} sx={{ textTransform: 'none' }} />
            <Tab label={t('user_detail_tab_audit')} sx={{ textTransform: 'none' }} />
          </Tabs>
          <Divider />
          <Box sx={{ p: 2 }}>
            {tab === 0 ? (
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>{t('user_detail_field_fullname')}:</strong> {user.fullName || '-'}
                </Typography>
                <Typography variant="body2">
                  <strong>{t('user_detail_field_phone')}:</strong> {profile.phone}
                </Typography>
                <Typography variant="body2">
                  <strong>{t('user_detail_field_dob')}:</strong> {profile.dob}
                </Typography>
                <Typography variant="body2">
                  <strong>{t('user_detail_field_gender')}:</strong> {profile.gender}
                </Typography>
                <Typography variant="body2">
                  <strong>{t('user_detail_field_bio')}:</strong> {profile.bio}
                </Typography>
              </Stack>
            ) : null}
            {tab === 1 ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('user_detail_academic_student_code')}</TableCell>
                    <TableCell>{t('user_detail_academic_degree')}</TableCell>
                    <TableCell>{t('user_detail_academic_class')}</TableCell>
                    <TableCell>{t('user_detail_academic_start')}</TableCell>
                    <TableCell>{t('user_detail_academic_graduated')}</TableCell>
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
                        <Typography variant="body2" color="text.secondary">{t('user_detail_academic_empty')}</Typography>
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
                      secondary={
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {t('user_detail_membership_verification')}: {formatEnumText(m.verificationLevel)}
                          </Typography>
                          <AdminStatusChip status={m.status} category="verification" />
                        </Stack>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : null}
            {tab === 3 ? (
              <Stack spacing={0.5}>
                <Typography variant="body2">{t('user_detail_activity_posts')}: {activity?.postsCreated ?? '-'}</Typography>
                <Typography variant="body2">{t('user_detail_activity_comments')}: {activity?.comments ?? '-'}</Typography>
                <Typography variant="body2">{t('user_detail_activity_events')}: {activity?.eventsAttended ?? '-'}</Typography>
                <Typography variant="body2">{t('user_detail_activity_page_views')}: {activity?.pageViewsSample ?? '-'}</Typography>
              </Stack>
            ) : null}
            {tab === 4 ? (
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>{t('user_detail_account_status')}:</strong> {formatDisplayStatusLabel(user, t)}
                </Typography>
                {user.banReason ? (
                  <Typography variant="body2">
                    <strong>{t('user_detail_ban_reason')}:</strong> {user.banReason}
                  </Typography>
                ) : null}
                {user.bannedUntil ? (
                  <Typography variant="body2">
                    <strong>{t('user_detail_banned_until')}:</strong> {formatDateTime(user.bannedUntil)}
                  </Typography>
                ) : user.status === 'BANNED' ? (
                  <Typography variant="body2">
                    <strong>{t('user_detail_banned_until')}:</strong> {t('user_detail_ban_permanent')}
                  </Typography>
                ) : null}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>
                  {t('user_detail_ban_history')}
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
                  {t('user_detail_login_history_desc')}
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
                        <TableCell>{t('user_detail_col_time')}</TableCell>
                        <TableCell>{t('user_detail_col_action')}</TableCell>
                        <TableCell>{t('user_detail_col_result')}</TableCell>
                        <TableCell>{t('user_detail_col_description')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(userLoginHistory ?? auditTrail).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4}>
                            <Typography variant="body2" color="text.secondary">
                              {t('user_detail_login_history_empty')}
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
                  {t('user_detail_open_audit_logs')}
                </Button>
                {userVerificationLogs.length > 0 ? (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {t('user_detail_verification_requests')}
                    </Typography>
                    <List dense>
                      {userVerificationLogs.map((item, idx) => (
                        <ListItem key={`${item.id || idx}`} disablePadding sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={
                              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                <Typography variant="body2">#{item.id || '-'}</Typography>
                                <AdminStatusChip status={item.status || t('user_detail_status_unknown')} category="verification" />
                              </Stack>
                            }
                            secondary={`${t('user_detail_type_label')}: ${item.documentType || '-'} · ${t('user_detail_created_at_label')}: ${formatDateTime(item.createdAt)}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                ) : null}
                {userAdminActions.length > 0 ? (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {t('user_detail_admin_actions')}
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>{t('user_detail_col_time')}</TableCell>
                          <TableCell>{t('user_detail_col_action')}</TableCell>
                          <TableCell>{t('user_detail_col_target')}</TableCell>
                          <TableCell>{t('user_detail_col_before')}</TableCell>
                          <TableCell>{t('user_detail_col_after')}</TableCell>
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
        title={t('user_detail_delete_account')}
        description={t('user_detail_delete_confirm', { name: user.fullName, id: user.id })}
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
