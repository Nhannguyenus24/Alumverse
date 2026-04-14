export const ADMIN_SORT_ORDER_OPTIONS = ['ASC', 'DESC'];

const normalize = (value) => String(value ?? '').toLowerCase();

export const includesQuery = (item, keys, query) => {
  const q = normalize(query).trim();
  if (!q) return true;
  const haystack = keys.map((key) => normalize(item?.[key])).join(' ');
  return haystack.includes(q);
};

export const sortByField = (rows, sortBy, sortOrder = 'DESC') => {
  const direction = sortOrder === 'ASC' ? 1 : -1;
  const list = [...rows];
  list.sort((a, b) => {
    const va = a?.[sortBy];
    const vb = b?.[sortBy];

    if (va == null && vb == null) return 0;
    if (va == null) return 1 * direction;
    if (vb == null) return -1 * direction;

    const da = new Date(va).getTime();
    const db = new Date(vb).getTime();
    if (!Number.isNaN(da) && !Number.isNaN(db)) {
      return (da - db) * direction;
    }

    if (typeof va === 'number' && typeof vb === 'number') {
      return (va - vb) * direction;
    }

    return String(va).localeCompare(String(vb)) * direction;
  });
  return list;
};

export const paginateRows = (rows, page, rowsPerPage) => {
  const start = page * rowsPerPage;
  return rows.slice(start, start + rowsPerPage);
};
