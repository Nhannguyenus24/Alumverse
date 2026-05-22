/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react';

const AdminSystemContext = createContext(null);

export const AdminSystemProvider = ({ value, children }) => (
  <AdminSystemContext.Provider value={value}>{children}</AdminSystemContext.Provider>
);

export const useAdminSystemContext = () => {
  const ctx = useContext(AdminSystemContext);
  if (!ctx) {
    throw new Error('useAdminSystemContext must be used within AdminSystemProvider');
  }
  return ctx;
};

