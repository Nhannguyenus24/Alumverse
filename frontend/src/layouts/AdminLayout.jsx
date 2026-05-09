import { useState } from 'react';
import { Outlet, useMatch } from 'react-router';
import { Box, useTheme, alpha } from '@mui/material';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import useAdminSystemData from '../hooks/admin/useAdminSystemData';
import useAdminUsersLocal from '../hooks/admin/useAdminUsersLocal';
import useAdminForumData from '../hooks/admin/useAdminForumData';
import { AdminSystemProvider } from '../contexts/AdminSystemContext';
import { AdminUsersProvider } from '../contexts/AdminUsersContext';
import { AdminForumProvider } from '../contexts/AdminForumContext';
import { useAuth } from '../hooks/useAuth';
import Page from '../components/Page';

const HEADER_HEIGHT = 70;
const SIDEBAR_WIDTH = 280;

const AdminLayoutShell = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  
  const slugMatchNested = useMatch('/:slug/admin/*');
  const slugMatchExact = useMatch('/:slug/admin');
  const slugMatch = slugMatchNested ?? slugMatchExact;
  const isSlugContext = Boolean(slugMatch);
  const slug = slugMatch?.params?.slug;
  const adminBase = isSlugContext ? `/${slug}/admin` : '/admin';
  
  const { user, logout } = useAuth();

  return (
    <Page
      title="Quản trị hệ thống"
      meta={<meta name="description" content="Khu vực quản trị HCMUS Alumni" />}
      sx={{ 
        display: 'flex', 
        minHeight: '100vh',
        bgcolor: alpha(theme.palette.background.default, 0.4) 
      }}
    >
      <AdminSidebar
        variant="permanent"
        adminBase={adminBase}
        userRole={user?.role}
      />
      
      <AdminSidebar
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        adminBase={adminBase}
        userRole={user?.role}
      />

      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
        }}
      >
        <AdminHeader
          onMenuOpen={() => setMobileOpen(true)}
          user={user}
          onLogout={logout}
        />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            pt: `${HEADER_HEIGHT + 24}px`,
            pb: 6,
            px: { xs: 2, sm: 3, lg: 4 },
            backgroundColor: (theme) => alpha(theme.palette.background.default, 0.5),
            minHeight: '100vh',
          }}
        >
          <Box sx={{ maxWidth: 1440, mx: 'auto' }}>
            <Outlet />
          </Box>
        </Box>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            py: 3,
            px: 4,
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
            textAlign: 'center',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                component="img"
                src="/alumverse_logo/Logo_Main_Full.svg"
                alt="Logo"
                sx={{ height: 24, opacity: 0.6 }}
              />
              <Box sx={{ width: 1, height: 16, bgcolor: 'divider', mx: 1 }} />
              <Box component="span" sx={{ fontSize: 12, color: 'text.disabled', fontWeight: 600 }}>
                CONTROL CENTER v2.0
              </Box>
            </Box>
            <Box component="span" sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
              © {new Date().getFullYear()} HCMUS Alumni. Bảo lưu mọi quyền.
            </Box>
          </Box>
        </Box>
      </Box>
    </Page>
  );
};

const AdminLayout = () => {
  const system = useAdminSystemData();
  const users = useAdminUsersLocal();
  const forum = useAdminForumData(system.activeOrgId);

  return (
    <AdminSystemProvider value={system}>
      <AdminUsersProvider value={users}>
        <AdminForumProvider value={forum}>
          <AdminLayoutShell />
        </AdminForumProvider>
      </AdminUsersProvider>
    </AdminSystemProvider>
  );
};

export default AdminLayout;
