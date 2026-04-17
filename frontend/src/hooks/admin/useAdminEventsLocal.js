import { useCallback } from 'react';
import { DEFAULT_ADMIN_EVENTS } from '../../constants/adminDefaultEvents';
import useAdminMockListState from './useAdminMockListState';

const useAdminEventsLocal = () => {
  const state = useAdminMockListState({
    initialRows: DEFAULT_ADMIN_EVENTS,
    searchKeys: ['title', 'organizerName', 'location', 'status'],
    defaultSortBy: 'startDate',
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
    events: state.rows,
    allEvents: state.allRows,
    updateStatus,
    deleteItem,
  };
};

export default useAdminEventsLocal;
