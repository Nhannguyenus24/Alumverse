import { useCallback } from 'react';
import { DEFAULT_ADMIN_ORGANIZATIONS } from '../../constants/adminDefaultOrganizations';
import useAdminMockListState from './useAdminMockListState';

const useAdminOrganizationsLocal = () => {
  const state = useAdminMockListState({
    initialRows: DEFAULT_ADMIN_ORGANIZATIONS,
    searchKeys: ['name', 'ownerName', 'status'],
    defaultSortBy: 'updatedAt',
    defaultRowsPerPage: 10,
  });

  const updateStatus = useCallback(
    (id, status) => {
      state.setRows((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, status, updatedAt: new Date().toISOString() } : row,
        ),
      );
    },
    [state],
  );

  const deleteItem = useCallback(
    (id) => {
      state.setRows((prev) => prev.filter((row) => row.id !== id));
    },
    [state],
  );

  return {
    ...state,
    organizations: state.rows,
    allOrganizations: state.allRows,
    updateStatus,
    deleteItem,
  };
};

export default useAdminOrganizationsLocal;
