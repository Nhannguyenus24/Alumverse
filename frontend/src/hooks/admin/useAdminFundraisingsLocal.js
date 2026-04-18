import { useCallback } from 'react';
import { DEFAULT_ADMIN_FUNDRAISINGS } from '../../constants/adminDefaultFundraisings';
import useAdminMockListState from './useAdminMockListState';

const useAdminFundraisingsLocal = () => {
  const state = useAdminMockListState({
    initialRows: DEFAULT_ADMIN_FUNDRAISINGS,
    searchKeys: ['title', 'ownerName', 'status'],
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
    fundraisings: state.rows,
    allFundraisings: state.allRows,
    updateStatus,
    deleteItem,
  };
};

export default useAdminFundraisingsLocal;
