/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react';

const AdminUsersContext = createContext(null);

export const AdminUsersProvider = ({ value, children }) => (
  <AdminUsersContext.Provider value={value}>{children}</AdminUsersContext.Provider>
);

export const useAdminUsersContext = () => {
  const ctx = useContext(AdminUsersContext);
  if (!ctx) {
    throw new Error('useAdminUsersContext must be used within AdminUsersProvider');
  }
  return ctx;
};

