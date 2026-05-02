import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import * as adminUserApi from '../../api/adminUserApi';

const addDaysIso = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload?.items) return payload.items;
  if (payload?.content) return payload.content;
  return [];
};

/** UserResponse has no fullName; overlay may set it. Fall back so "Sort by name" matches visible identity. */
const sortableDisplayName = (user) => {
  const name = user?.fullName?.trim();
  if (name) return name;
  const login = user?.userName?.trim();
  if (login) return login;
  return String(user?.email ?? '').trim();
};

const useAdminUsersLocal = () => {
  // ── Server-fetched users ──────────────────────────────────────────────────
  const [serverUsers, setServerUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Local overlay for fields the backend doesn't return (fullName, orgId, ban details…)
  const [localOverlay, setLocalOverlay] = useState({});

  // ── Filter / sort / pagination state ────────────────────────────────────
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [organizationFilter, setOrganizationFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // ── Load from API ─────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminUserApi.getUsers(0, 100);
      const payload = res?.data?.data;
      const items = normalizeList(payload);
      setServerUsers(Array.isArray(items) ? items : []);
    } catch {
      setServerUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ── Merged view ───────────────────────────────────────────────────────────
  const allUsers = useMemo(() => {
    const merged = serverUsers.map((u) => ({
      ...u,
      ...(localOverlay[u.id] ?? {}),
    }));
    return merged;
  }, [serverUsers, localOverlay]);

  // ── Client-side filtering ─────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allUsers.filter((user) => {
      if (roleFilter !== 'ALL' && user.role !== roleFilter) return false;
      if (statusFilter !== 'ALL' && user.status !== statusFilter) return false;
      if (organizationFilter !== 'ALL' && Number(user.organizationId) !== Number(organizationFilter)) return false;
      if (!q) return true;
      const haystack = [user.fullName, user.email, user.userName, user.status, user.role, user.organizationName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [allUsers, search, roleFilter, statusFilter, organizationFilter]);

  const sortedUsers = useMemo(() => {
    const dir = sortOrder === 'ASC' ? 1 : -1;
    const list = [...filteredUsers];
    list.sort((a, b) => {
      if (sortBy === 'fullName') {
        const sa = sortableDisplayName(a);
        const sb = sortableDisplayName(b);
        let cmp = sa.localeCompare(sb, undefined, { sensitivity: 'base' });
        if (cmp === 0) {
          cmp = String(a.email || '').localeCompare(String(b.email || ''), undefined, { sensitivity: 'base' });
        }
        return dir * cmp;
      }
      if (sortBy === 'email') {
        return dir * String(a.email || '').localeCompare(String(b.email || ''), undefined, { sensitivity: 'base' });
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

  // ── Helpers ───────────────────────────────────────────────────────────────
  // Keep a ref snapshot for optimistic-revert patterns
  const serverUsersRef = useRef(serverUsers);
  useEffect(() => { serverUsersRef.current = serverUsers; }, [serverUsers]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createUser = useCallback(async (payload) => {
    if (String(payload?.role || '').toUpperCase() !== 'ADMIN') {
      enqueueSnackbar(
        'Only ADMIN accounts can be created here. Use public sign-up for STUDENT, ALUMNI, STAFF, or GUEST.',
        { variant: 'warning' },
      );
      throw new Error('CREATE_ROLE');
    }
    if (!payload?.password) {
      enqueueSnackbar('Password is required.', { variant: 'error' });
      throw new Error('CREATE_PASSWORD');
    }
    try {
      await adminUserApi.createAdminAccount({
        email: String(payload.email || '').trim(),
        fullName: String(payload.fullName || '').trim(),
        userName: String(payload.userName || '').trim(),
        password: payload.password,
        organizationId: Number(payload.organizationId),
      });
      enqueueSnackbar('Admin account created.', { variant: 'success' });
      await loadUsers();
    } catch (e) {
      if (e?.message === 'CREATE_ROLE' || e?.message === 'CREATE_PASSWORD') {
        throw e;
      }
      const msg = e?.response?.data?.message || 'Failed to create admin.';
      enqueueSnackbar(msg, { variant: 'error' });
      throw e;
    }
  }, [loadUsers]);

  const updateUser = useCallback(
    async (id, payload) => {
      const uid = Number(id);
      const snapshot = serverUsersRef.current;
      const {
        password: _omit,
        fullName,
        organizationId,
        organizationName: _orgName,
        membershipStatus,
        ...rest
      } = payload;
      const now = new Date().toISOString();

      const body = {
        ...rest,
        ...(fullName !== undefined ? { fullName: String(fullName || '').trim() } : {}),
        ...(organizationId !== undefined && organizationId !== '' && !Number.isNaN(Number(organizationId))
          ? { organizationId: Number(organizationId) }
          : {}),
      };

      setServerUsers((prev) =>
        prev.map((u) =>
          Number(u.id) === uid
            ? {
                ...u,
                ...rest,
                ...(fullName !== undefined ? { fullName } : {}),
                ...(organizationId !== undefined ? { organizationId: Number(organizationId) } : {}),
                ...(payload.organizationName !== undefined ? { organizationName: payload.organizationName } : {}),
                ...(membershipStatus !== undefined ? { membershipStatus } : {}),
                updatedAt: now,
              }
            : u,
        ),
      );

      try {
        await adminUserApi.updateUser(uid, body);
        await loadUsers();
        setLocalOverlay((prev) => {
          const next = { ...prev };
          delete next[uid];
          return next;
        });
        enqueueSnackbar('User updated successfully.', { variant: 'success' });
      } catch (e) {
        setServerUsers(snapshot);
        setLocalOverlay((prev) => {
          const next = { ...prev };
          delete next[uid];
          return next;
        });
        enqueueSnackbar(e?.response?.data?.message || e?.message || 'Failed to update user.', { variant: 'error' });
        throw e;
      }
    },
    [loadUsers],
  );

  const deleteUser = useCallback(
    async (id) => {
      const uid = Number(id);
      const snapshot = serverUsersRef.current;
      setServerUsers((prev) => prev.filter((u) => Number(u.id) !== uid));
      setLocalOverlay((prev) => {
        const next = { ...prev };
        delete next[uid];
        return next;
      });

      try {
        await adminUserApi.deleteUser(uid, false);
        enqueueSnackbar('User removed from list.', { variant: 'success' });
        await loadUsers();
      } catch (e) {
        setServerUsers(snapshot);
        enqueueSnackbar(e?.response?.data?.message || 'Delete failed.', { variant: 'error' });
        throw e;
      }
    },
    [loadUsers],
  );

  const updateUserStatus = useCallback(async (id, status) => {
    const uid = Number(id);
    const now = new Date().toISOString();
    const snapshot = serverUsersRef.current;

    setServerUsers((prev) =>
      prev.map((u) => (Number(u.id) === uid ? { ...u, status, updatedAt: now } : u)),
    );

    try {
      await adminUserApi.updateUser(uid, { status });
      await loadUsers();
      enqueueSnackbar('User status saved.', { variant: 'success' });
    } catch (e) {
      setServerUsers(snapshot);
      enqueueSnackbar(e?.response?.data?.message || 'Failed to update status.', { variant: 'error' });
      throw e;
    }
  }, [loadUsers]);

  const banUser = useCallback(
    async (id, { reason, customReason, durationDays, isPermanent }) => {
      const uid = Number(id);
      const now = new Date().toISOString();
      const finalReason =
        reason === 'OTHER' ? (customReason || '').trim() || 'Other' : reason || 'Moderation';
      const bannedUntil =
        isPermanent || durationDays == null ? null : addDaysIso(Number(durationDays) || 0);
      const snapshot = serverUsersRef.current;

      setServerUsers((prev) =>
        prev.map((u) => (Number(u.id) === uid ? { ...u, status: 'BANNED', updatedAt: now } : u)),
      );

      setLocalOverlay((prev) => {
        const existing = prev[uid] ?? {};
        const history = Array.isArray(existing.banHistory) ? [...existing.banHistory] : [];
        history.unshift({ at: now, reason: finalReason, durationDays: isPermanent ? null : durationDays });
        return {
          ...prev,
          [uid]: { ...existing, banReason: finalReason, bannedUntil, banHistory: history },
        };
      });

      try {
        await adminUserApi.banUser(uid);
        await loadUsers();
        enqueueSnackbar('User banned.', { variant: 'success' });
      } catch (e) {
        setServerUsers(snapshot);
        setLocalOverlay((prev) => {
          const next = { ...prev };
          delete next[uid];
          return next;
        });
        enqueueSnackbar(e?.response?.data?.message || 'Ban failed.', { variant: 'error' });
        throw e;
      }
    },
    [loadUsers],
  );

  const unbanUser = useCallback(async (id) => {
    const uid = Number(id);
    const now = new Date().toISOString();
    const snapshot = serverUsersRef.current;

    setServerUsers((prev) =>
      prev.map((u) => (Number(u.id) === uid ? { ...u, status: 'ACTIVE', updatedAt: now } : u)),
    );

    setLocalOverlay((prev) => ({
      ...prev,
      [uid]: { ...(prev[uid] ?? {}), banReason: undefined, bannedUntil: undefined },
    }));

    try {
      await adminUserApi.unbanUser(uid);
      await loadUsers();
      enqueueSnackbar('User unbanned.', { variant: 'success' });
    } catch (e) {
      setServerUsers(snapshot);
      enqueueSnackbar(e?.response?.data?.message || 'Unban failed.', { variant: 'error' });
      throw e;
    }
  }, [loadUsers]);

  return {
    loading,
    allUsers,
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
    reloadUsers: loadUsers,
  };
};

export default useAdminUsersLocal;
