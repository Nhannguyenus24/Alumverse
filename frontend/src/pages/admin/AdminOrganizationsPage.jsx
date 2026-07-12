import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { useOutletContext } from 'react-router';
import { adminOrganizationApi, organizationApi } from '../../utils/api';
import { useAdminSystemContext } from '../../stores/AdminStore';

const ORG_LOCAL_TOUCH_KEY = 'admin-organizations-local-touch';

const readLocalTouchMap = () => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    return JSON.parse(window.sessionStorage.getItem(ORG_LOCAL_TOUCH_KEY) || '{}') || {};
  } catch {
    return {};
  }
};

const writeLocalTouchMap = (value) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(ORG_LOCAL_TOUCH_KEY, JSON.stringify(value));
};

const withDefaults = (organization) => ({
  ...organization,
  status: String(organization?.status || 'ACTIVE').toUpperCase(),
});

const getOrganizationSortTime = (organization) => {
  const value = organization?._localTouchedAt || organization?.updatedAt || organization?.updated_at || organization?.createdAt || organization?.created_at;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
};

const sortOrganizationsByRecent = (organizations) => (
  [...organizations].sort((a, b) => {
    const recentDiff = getOrganizationSortTime(b) - getOrganizationSortTime(a);
    if (recentDiff !== 0) {
      return recentDiff;
    }

    return Number(a.id || 0) - Number(b.id || 0);
  })
);

const AdminOrganizationsPage = () => {
  const { t } = useTranslation('admin');
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(null);
   const [introduction, setIntroduction] = useState(null);
  const { setBreadcrumbs } = useOutletContext();
  const { activeOrgId } = useAdminSystemContext();
  const previousActiveOrgIdRef = useRef(null);
  const localTouchRef = useRef(readLocalTouchMap());
  
  useEffect(() => {
    setBreadcrumbs?.([{ label: t('nav_organizations'), active: true }]);
  }, [setBreadcrumbs]);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [introDialogOpen, setIntroDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const loadOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await adminOrganizationApi.getOrganizations({ page: 0, size: 100 });
      const touchMap = localTouchRef.current;
      setOrganizations(Array.isArray(rows)
        ? sortOrganizationsByRecent(rows.map((row) => withDefaults({
          ...row,
          _localTouchedAt: touchMap[String(row.id)] || null,
        })))
        : []);
    } catch (error) {
      setOrganizations([]);
      enqueueSnackbar(error?.response?.data?.message || t('org_load_error'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => { loadOrganizations(); }, [loadOrganizations]);

  useEffect(() => {
    if (organizations.length === 0) return;
    setSelectedOrganizationId((prev) => {
      if (prev == null || !organizations.some((o) => o.id === prev)) {
        const activeOrg = organizations.find((o) => String(o.id) === String(activeOrgId));
        return activeOrg?.id ?? organizations[0].id;
      }
      return prev;
    });
  }, [organizations, activeOrgId]);

  useEffect(() => {
    if (!activeOrgId || organizations.length === 0) return;
    const activeOrgChanged = String(previousActiveOrgIdRef.current) !== String(activeOrgId);
    previousActiveOrgIdRef.current = activeOrgId;
    if (!activeOrgChanged) return;

    const activeOrg = organizations.find((o) => String(o.id) === String(activeOrgId));
    if (activeOrg) {
      setSelectedOrganizationId((prev) => (
        String(prev) === String(activeOrg.id) ? prev : activeOrg.id
      ));
    }
  }, [activeOrgId, organizations]);

  const loadIntroduction = useCallback(async () => {
    if (!selectedOrganizationId) { setIntroduction(null); return; }
    try {
      const data = await organizationApi.getIntroduction(selectedOrganizationId);
      setIntroduction(data || null);
    } catch { setIntroduction(null); }
  }, [selectedOrganizationId]);

  useEffect(() => { loadIntroduction(); }, [loadIntroduction]);

  const selectedOrganization = useMemo(
    () => organizations.find((org) => org.id === selectedOrganizationId) || null,
    [organizations, selectedOrganizationId],
  );

  const handleUpdateOrganization = useCallback(async (orgId, payload) => {
    const targetId = orgId || editTarget?.id;
    if (!targetId) return;

    const parseIfNeeded = (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string' && val.trim().startsWith('[')) {
        try { return JSON.parse(val); } catch { return []; }
      }
      return Array.isArray(val) ? val : [];
    };

    const cleanPayload = {
      name: payload.name,
      slug: payload.slug,
      logoUrl: payload.logoUrl,
      status: payload.status,
      featuresConfig: payload.featuresConfig,
      programs: parseIfNeeded(payload.programs),
      majors: parseIfNeeded(payload.majors),
      contactPhone: payload.contactPhone,
      contactEmail: payload.contactEmail,
      departmentName: payload.departmentName,
    };

    try {
      const updated = await adminOrganizationApi.updateOrganization(targetId, cleanPayload);
      const touchedAt = new Date().toISOString();
      localTouchRef.current = {
        ...localTouchRef.current,
        [String(targetId)]: touchedAt,
      };
      writeLocalTouchMap(localTouchRef.current);

      setOrganizations((prev) => {
        const current = prev.find((item) => item.id === targetId);
        const updatedItem = withDefaults({
          ...(updated || { ...current, ...cleanPayload }),
          _localTouchedAt: touchedAt,
        });
        return sortOrganizationsByRecent([updatedItem, ...prev.filter((item) => item.id !== targetId)]);
      });
      setEditDialogOpen(false);
      enqueueSnackbar(t('org_update_success'), { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || t('org_update_error'), { variant: 'error' });
    }
  }, [editTarget, enqueueSnackbar]);

  const handleDeleteOrganization = useCallback(async (orgId) => {
    if (!window.confirm(t('org_delete_confirm'))) return;
    try {
      await adminOrganizationApi.deleteOrganization(orgId);
      setOrganizations((prev) => prev.filter((item) => item.id !== orgId));
      enqueueSnackbar(t('org_delete_success'), { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || t('org_delete_error'), { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const handleUpdateIntroduction = useCallback(async (payload) => {
    if (!selectedOrganizationId) return;
    try {
      const updated = await adminOrganizationApi.upsertIntroduction(selectedOrganizationId, payload);
      setIntroduction(updated || { ...introduction, ...payload });
      setIntroDialogOpen(false);
      enqueueSnackbar(t('org_intro_update_success'), { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || t('org_intro_update_error'), { variant: 'error' });
    }
  }, [selectedOrganizationId, introduction, enqueueSnackbar]);

  const handlePromoteOrganization = useCallback((orgId) => {
    const touchedAt = new Date().toISOString();
    localTouchRef.current = {
      ...localTouchRef.current,
      [String(orgId)]: touchedAt,
    };
    writeLocalTouchMap(localTouchRef.current);

    setOrganizations((prev) => {
      const target = prev.find((item) => item.id === orgId);
      if (!target) return prev;
      return sortOrganizationsByRecent([
        { ...target, _localTouchedAt: touchedAt },
        ...prev.filter((item) => item.id !== orgId),
      ]);
    });
  }, []);

  const stats = useMemo(() => {
    const total = organizations.length;
    const active = organizations.filter(o => o.status === 'ACTIVE').length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [organizations]);

  const handleCreateOrganization = useCallback(async (payload) => {
    try {
      const created = await adminOrganizationApi.createOrganization(payload);
      const touchedAt = new Date().toISOString();
      if (created?.id) {
        localTouchRef.current = {
          ...localTouchRef.current,
          [String(created.id)]: touchedAt,
        };
        writeLocalTouchMap(localTouchRef.current);
      }

      setOrganizations(prev => sortOrganizationsByRecent([
        withDefaults({ ...created, _localTouchedAt: touchedAt }),
        ...prev,
      ]));
      setEditDialogOpen(false);
      enqueueSnackbar(t('org_create_success'), { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || t('org_create_error'), { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  if (loading && organizations.length === 0) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="rounded" height={100} />
        <Grid container spacing={3}>
          {[1, 2, 3].map(i => (
            <Grid item xs={12} md={4} key={i}><Skeleton variant="rounded" height={120} /></Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={600} />
      </Stack>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
            {t('org_page_title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
            {t('org_page_subtitle')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setEditTarget(null); setEditDialogOpen(true); }}
          sx={{ borderRadius: 1, fontWeight: 700, textTransform: 'none' }}
        >
          {t('org_add_btn')}
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
          label={t('metric_total_orgs')}
          value={stats.total}
          icon={<BusinessIcon />}
        />
        <AdminDashboardMetricTile
          label={t('metric_active_orgs')}
          value={stats.active}
          icon={<CheckCircleIcon />}
          valueColor="success.main"
        />
        <AdminDashboardMetricTile
          label={t('org_metric_suspended')}
          value={stats.inactive}
          icon={<ErrorIcon />}
          valueColor="error.main"
        />
      </Box>

      <AdminOrganizationMasterDetail
        organizations={organizations}
        selectedOrganizationId={selectedOrganizationId}
        onSelectOrganizationId={setSelectedOrganizationId}
        selectedOrganization={selectedOrganization}
        selectedIntroduction={introduction}
        onEditOrganization={(org) => { setEditTarget(org); setEditDialogOpen(true); }}
        onEditIntroduction={() => setIntroDialogOpen(true)}
        onRefreshIntroduction={loadIntroduction}
        onUpdateOrganization={(org) => handleUpdateOrganization(org.id, org)}
        onDeleteOrganization={handleDeleteOrganization}
        onRefresh={loadOrganizations}
        onPromoteOrganization={handlePromoteOrganization}
      />

      <AdminOrganizationEditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        organization={editTarget}
        onConfirm={editTarget ? (payload) => handleUpdateOrganization(editTarget.id, payload) : handleCreateOrganization}
      />

      <AdminOrganizationIntroductionDialog
        open={introDialogOpen}
        onClose={() => setIntroDialogOpen(false)}
        introduction={introduction}
        onConfirm={handleUpdateIntroduction}
      />
    </Box>
  );
};

const StatCard = ({ label, value, icon }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      border: 1,
      borderColor: 'divider',
      borderRadius: 3,
      display: 'flex',
      alignItems: 'center',
      gap: 2,
    }}
  >
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1,
        bgcolor: 'action.hover',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgColor: 'primary.main'
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.25 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>
        {value}
      </Typography>
    </Box>
  </Paper>
);

export default AdminOrganizationsPage;
