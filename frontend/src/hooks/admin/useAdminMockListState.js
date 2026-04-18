import { useMemo, useState } from 'react';
import { includesQuery, paginateRows, sortByField } from '../../utils/adminTableState';

const useAdminMockListState = ({
  initialRows,
  searchKeys,
  defaultSortBy = 'updatedAt',
  defaultSortOrder = 'DESC',
  defaultRowsPerPage = 10,
}) => {
  const [rows, setRows] = useState(() => initialRows.map((row) => ({ ...row })));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState(defaultSortBy);
  const [sortOrder, setSortOrder] = useState(defaultSortOrder);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  const filteredRows = useMemo(() => {
    return rows.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }
      return includesQuery(item, searchKeys, search);
    });
  }, [rows, search, searchKeys, statusFilter]);

  const sortedRows = useMemo(
    () => sortByField(filteredRows, sortBy, sortOrder),
    [filteredRows, sortBy, sortOrder],
  );

  const pagedRows = useMemo(
    () => paginateRows(sortedRows, page, rowsPerPage),
    [sortedRows, page, rowsPerPage],
  );

  return {
    allRows: rows,
    setRows,
    filteredCount: sortedRows.length,
    rows: pagedRows,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
  };
};

export default useAdminMockListState;
