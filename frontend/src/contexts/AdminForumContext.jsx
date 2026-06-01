/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react';

const AdminForumContext = createContext(null);

export const AdminForumProvider = ({ value, children }) => (
  <AdminForumContext.Provider value={value}>{children}</AdminForumContext.Provider>
);

export const useAdminForumContext = () => {
  const ctx = useContext(AdminForumContext);
  if (!ctx) {
    throw new Error('useAdminForumContext must be used within AdminForumProvider');
  }
  return ctx;
};

