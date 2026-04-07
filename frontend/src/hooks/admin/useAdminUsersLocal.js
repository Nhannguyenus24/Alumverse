import { useCallback, useMemo, useState } from 'react';
import { ADMIN_ORGANIZATION_OPTIONS, DEFAULT_ADMIN_USERS } from '../../constants/adminDefaultUsers';

const ADMIN_ORG_FALLBACK_ID = ADMIN_ORGANIZATION_OPTIONS[0]?.id ?? 1;

const nextId = (users) => {
  const max = users.reduce((acc, u) => (u.id > acc ? u.id : acc), 0);
  return max + 1;
};

const addDaysIso = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

const useAdminUsersLocal = () => {
  const [users, setUsers] = useState(() => DEFAULT_ADMIN_USERS.map((u) => ({ ...u })));
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [organizationFilter, setOrganizationFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== 'ALL' && user.role !== roleFilter) {
        return false;
      }
      if (statusFilter !== 'ALL' && user.status !== statusFilter) {
        return false;
      }
      if (organizationFilter !== 'ALL' && Number(user.organizationId) !== Number(organizationFilter)) {
        return false;
      }
      if (!q) {
        return true;
      }
      const haystack = [user.fullName, user.email, user.userName, user.status, user.role, user.organizationName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [users, search, roleFilter, statusFilter, organizationFilter]);

  const sortedUsers = useMemo(() => {
    const dir = sortOrder === 'ASC' ? 1 : -1;
    const list = [...filteredUsers];
    list.sort((a, b) => {
      if (sortBy === 'fullName') {
        return dir * String(a.fullName || '').localeCompare(String(b.fullName || ''));
      }
      if (sortBy === 'email') {
        return dir * String(a.email || '').localeCompare(String(b.email || ''));
      }
      if (sortBy === 'updatedAt') {
        const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return dir * (ta - tb);
      }
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return dir * (ta - tb);
    });
    return list;
  }, [filteredUsers, sortBy, sortOrder]);

  const pagedUsers = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedUsers.slice(start, start + rowsPerPage);
  }, [sortedUsers, page, rowsPerPage]);

  const createUser = useCallback((payload) => {
    const { password: _omitPassword, ...rest } = payload;
    const now = new Date().toISOString();
    setUsers((prev) => [
      ...prev,
      {
        id: nextId(prev),
        ...rest,
        email: rest.email.trim(),
        userName: rest.userName.trim(),
        fullName: rest.fullName.trim(),
        organizationId: rest.organizationId ?? ADMIN_ORG_FALLBACK_ID,
        organizationName:
          rest.organizationName ??
          ADMIN_ORGANIZATION_OPTIONS.find((o) => o.id === (rest.organizationId ?? ADMIN_ORG_FALLBACK_ID))
            ?.name ??
          '',
        membershipStatus: rest.membershipStatus ?? 'pending',
        createdAt: now,
        updatedAt: now,
      },
    ]);
  }, []);

  const updateUser = useCallback((id, payload) => {
    const { password: _omitPassword, ...rest } = payload;
    const now = new Date().toISOString();
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id
          ? {
              ...user,
              ...rest,
              email: rest.email.trim(),
              userName: rest.userName.trim(),
              fullName: rest.fullName.trim(),
              updatedAt: now,
            }
          : user,
      ),
    );
  }, []);

  const deleteUser = useCallback((id) => {
    setUsers((prev) => prev.filter((user) => user.id !== id));
  }, []);

  const updateUserStatus = useCallback((id, status) => {
    const now = new Date().toISOString();
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id
          ? {
              ...user,
              status,
              updatedAt: now,
              ...(status !== 'BANNED'
                ? { banReason: undefined, bannedUntil: undefined }
                : {}),
            }
          : user,
      ),
    );
  }, []);

  const banUser = useCallback((id, { reason, customReason, durationDays, isPermanent }) => {
    const now = new Date().toISOString();
    const finalReason =
      reason === 'OTHER' ? (customReason || '').trim() || 'Other' : reason || 'Moderation';
    const bannedUntil =
      isPermanent || durationDays == null ? null : addDaysIso(Number(durationDays) || 0);
    setUsers((prev) =>
      prev.map((user) => {
        if (user.id !== id) {
          return user;
        }
        const history = Array.isArray(user.banHistory) ? [...user.banHistory] : [];
        history.unshift({ at: now, reason: finalReason, durationDays: isPermanent ? null : durationDays });
        return {
          ...user,
          status: 'BANNED',
          banReason: finalReason,
          bannedUntil,
          updatedAt: now,
          banHistory: history,
        };
      }),
    );
  }, []);

  const unbanUser = useCallback((id) => {
    const now = new Date().toISOString();
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id
          ? {
              ...user,
              status: 'ACTIVE',
              banReason: undefined,
              bannedUntil: undefined,
              updatedAt: now,
            }
          : user,
      ),
    );
  }, []);

  return {
    allUsers: users,
    filteredCount: sortedUsers.length,
    users: pagedUsers,
    sortedUsers,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    organizationFilter,
    setOrganizationFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    createUser,
    updateUser,
    updateUserStatus,
    deleteUser,
    banUser,
    unbanUser,
  };
};

export default useAdminUsersLocal;
