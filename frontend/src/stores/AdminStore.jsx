/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react';

// --- Contexts ---
const AdminSystemContext = createContext(null);
const AdminUsersContext = createContext(null);
const AdminForumContext = createContext(null);

// --- Providers ---
const AdminSystemProvider = ({ value, children }) => (
  <AdminSystemContext.Provider value={value}>{children}</AdminSystemContext.Provider>
);

const AdminUsersProvider = ({ value, children }) => (
  <AdminUsersContext.Provider value={value}>{children}</AdminUsersContext.Provider>
);

const AdminForumProvider = ({ value, children }) => (
  <AdminForumContext.Provider value={value}>{children}</AdminForumContext.Provider>
);

// Combined Provider for convenience
export const AdminProvider = ({ system, users, forum, children }) => (
  <AdminSystemProvider value={system}>
    <AdminUsersProvider value={users}>
      <AdminForumProvider value={forum}>
        {children}
      </AdminForumProvider>
    </AdminUsersProvider>
  </AdminSystemProvider>
);

// --- Hooks ---
export const useAdminSystemContext = () => {
  const ctx = useContext(AdminSystemContext);
  if (!ctx) {
    throw new Error('useAdminSystemContext must be used within AdminSystemProvider');
  }
  return ctx;
};

export const useAdminUsersContext = () => {
  const ctx = useContext(AdminUsersContext);
  if (!ctx) {
    throw new Error('useAdminUsersContext must be used within AdminUsersProvider');
  }
  return ctx;
};

export const useAdminForumContext = () => {
  const ctx = useContext(AdminForumContext);
  if (!ctx) {
    throw new Error('useAdminForumContext must be used within AdminForumProvider');
  }
  return ctx;
};
