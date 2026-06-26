import { useEffect, useState, useMemo } from 'react';
import { Outlet, useParams, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Box, useTheme, alpha } from '@mui/material';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import useAdminSystemData from '../hooks/admin/useAdminSystemData';
import useAdminUsersLocal from '../hooks/admin/useAdminUsersLocal';
import useAdminForumData from '../hooks/admin/useAdminForumData';
import { AdminProvider } from '../stores/AdminStore';
import useOrganizationStore from '../stores/organizationStore';
import { useAuth } from '../hooks/useAuth';
import { useMyProfile } from '../hooks/profile/useMyProfile';
import Page from '../components/Page';

const HEADER_HEIGHT = 88;
const SIDEBAR_WIDTH = 280;
const SIDEBAR_COLLAPSED_WIDTH = 88;

const AdminLayoutShell = () => {
  const { t } = useTranslation('admin');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState(null);
  const theme = useTheme();
  
  const outletContext = useMemo(() => ({ setBreadcrumbs }), []);

  const { slug } = useParams();
  const adminBase = slug ? `/${slug}/admin` : '/admin';

  const { user, logout } = useAuth();
  const profileQuery = useMyProfile();
  const profile = profileQuery.data;
  const headerUser = useMemo(() => {
    if (!user) return profile ?? null;
    if (!profile) return user;

    return {
      ...user,
      fullName: profile.fullName ?? profile.name ?? user.fullName,
      studentId: profile.studentId ?? user.studentId,
      email: profile.email ?? user.email,
      avatarUrl:
        profile.avatarUrl ??
        profile.avatar_url ??
        profile.avatar ??
        profile.imageUrl ??
        profile.image ??
        user.avatarUrl,
    };
  }, [profile, user]);

  const currentSidebarWidth = isSidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <Page
      title={t('settings')}
      meta={<meta name="description" content="HCMUS Alumni Admin" />}
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: alpha(theme.palette.background.default, 0.4),
      }}
    >
      {[
        {
          variant: 'permanent',
          collapsed: isSidebarCollapsed,
          onToggle: () => setIsSidebarCollapsed(!isSidebarCollapsed),
        },
        {
          variant: 'temporary',
          open: mobileOpen,
          onClose: () => setMobileOpen(false),
        },
      ].map((sidebarProps) => (
        <AdminSidebar
          key={sidebarProps.variant}
          adminBase={adminBase}
          userRole={user?.role}
          {...sidebarProps}
        />
      ))}

      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: { md: `calc(100% - ${currentSidebarWidth}px)` },
          transition: theme.transitions.create(['width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <AdminHeader
          onMenuOpen={() => setMobileOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          user={headerUser}
          onLogout={logout}
          breadcrumbs={breadcrumbs}
        />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            pt: `${HEADER_HEIGHT + 24}px`,
            pb: 6,
            px: { xs: 2, sm: 3, lg: 4 },
            backgroundColor: (t) => alpha(t.palette.background.default, 0.5),
            minHeight: '100vh',
          }}
        >
          <Box>
            <Outlet context={outletContext} />
          </Box>
        </Box>
      </Box>
    </Page>
  );
};

const AdminLayout = () => {
  const location = useLocation();
  const { slug } = useParams();
  const system = useAdminSystemData({
    slug,
  });
  const setOrganization = useOrganizationStore((state) => state.setOrganization);
  const isUsersPage = location.pathname.includes('/users');
  const users = useAdminUsersLocal(system.stableOrgId, isUsersPage);

  // Only load forum data when on forum pages — avoids firing 6 API calls
  // unnecessarily when switching org while on Events / Users / etc.
  const isForumPage = location.pathname.includes('/forum');
  const forum = useAdminForumData(system.stableOrgId, isForumPage);

  useEffect(() => {
    if (system.activeOrganization) {
      setOrganization(system.activeOrganization);
    }
  }, [setOrganization, system.activeOrganization]);

  return (
    <AdminProvider system={system} users={users} forum={forum}>
      <AdminLayoutShell />
    </AdminProvider>
  );
};

export default AdminLayout;
