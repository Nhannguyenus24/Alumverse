import { useCallback } from 'react';
import { DEFAULT_ADMIN_MENTORSHIPS } from '../../constants/adminDefaultMentorships';
import useAdminMockListState from './useAdminMockListState';

const useAdminMentorshipsLocal = () => {
  const state = useAdminMockListState({
    initialRows: DEFAULT_ADMIN_MENTORSHIPS,
    searchKeys: ['mentorName', 'menteeName', 'topic', 'status'],
    defaultSortBy: 'sessionDate',
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
    mentorships: state.rows,
    allMentorships: state.allRows,
    updateStatus,
    deleteItem,
  };
};

export default useAdminMentorshipsLocal;
