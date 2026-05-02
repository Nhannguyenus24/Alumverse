import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ADMIN_ORGANIZATION_OPTIONS, DEFAULT_ADMIN_USERS } from '../../constants/adminDefaultUsers';
import * as adminUserApi from '../../api/adminUserApi';

const ADMIN_ORG_FALLBACK_ID = ADMIN_ORGANIZATION_OPTIONS[0]?.id ?? 1;

const nextLocalId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;

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

  // Users created via createUser() — no backend endpoint, lives local-only
  const [localOnlyUsers, setLocalOnlyUsers] = useState([]);

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
      setServerUsers(items.length > 0 ? items : DEFAULT_ADMIN_USERS);
    } catch {
      setServerUsers((prev) => (prev.length > 0 ? prev : DEFAULT_ADMIN_USERS));
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
    return [...merged, ...localOnlyUsers];
  }, [serverUsers, localOverlay, localOnlyUsers]);

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
  const isLocalOnly = useCallback(
    (id) => localOnlyUsers.some((u) => u.id === id),
    [localOnlyUsers],
  );

  // Keep a ref snapshot for optimistic-revert patterns
  const serverUsersRef = useRef(serverUsers);
  useEffect(() => { serverUsersRef.current = serverUsers; }, [serverUsers]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createUser = useCallback((payload) => {
    const { password: _omit, ...rest } = payload;
    const now = new Date().toISOString();
    setLocalOnlyUsers((prev) => [
      ...prev,
      {
        id: nextLocalId(),
        ...rest,
        email: rest.email?.trim() ?? '',
        userName: rest.userName?.trim() ?? '',
        fullName: rest.fullName?.trim() ?? '',
        organizationId: rest.organizationId ?? ADMIN_ORG_FALLBACK_ID,
        organizationName:
          rest.organizationName ??
          ADMIN_ORGANIZATION_OPTIONS.find((o) => o.id === (rest.organizationId ?? ADMIN_ORG_FALLBACK_ID))?.name ??
          '',
        membershipStatus: rest.membershipStatus ?? 'pending',
        createdAt: now,
        updatedAt: now,
      },
    ]);
  }, []);

  const updateUser = useCallback(
    async (id, payload) => {
      const { password: _omit, fullName, organizationId, organizationName, membershipStatus, ...apiPayload } = payload;
      const now = new Date().toISOString();

      // Save display-only fields to overlay
      setLocalOverlay((prev) => ({
        ...prev,
        [id]: {
          ...(prev[id] ?? {}),
          ...(fullName !== undefined ? { fullName } : {}),
          ...(organizationId !== undefined ? { organizationId } : {}),
          ...(organizationName !== undefined ? { organizationName } : {}),
          ...(membershipStatus !== undefined ? { membershipStatus } : {}),
        },
      }));

      if (isLocalOnly(id)) {
        setLocalOnlyUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, ...payload, updatedAt: now } : u)),
        );
        return;
      }

      // Optimistic server update
      setServerUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...apiPayload, updatedAt: now } : u)),
      );

      try {
        const res = await adminUserApi.updateUser(id, apiPayload);
        const updated = res?.data?.data;
        if (updated) {
          setServerUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
        }
      } catch {
        // Revert server fields to snapshot
        setServerUsers(serverUsersRef.current);
      }
    },
    [isLocalOnly],
  );

  const deleteUser = useCallback(
    async (id) => {
      if (isLocalOnly(id)) {
        setLocalOnlyUsers((prev) => prev.filter((u) => u.id !== id));
        return;
      }

      // Optimistic remove
      const snapshot = serverUsersRef.current;
      setServerUsers((prev) => prev.filter((u) => u.id !== id));
      setLocalOverlay((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      try {
        await adminUserApi.deleteUser(id, false);
      } catch {
        setServerUsers(snapshot);
      }
    },
    [isLocalOnly],
  );

  const updateUserStatus = useCallback(async (id, status) => {
    const now = new Date().toISOString();
    const snapshot = serverUsersRef.current;

    setServerUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status, updatedAt: now } : u)),
    );

    try {
      await adminUserApi.updateUser(id, { status });
    } catch {
      setServerUsers(snapshot);
    }
  }, []);

  const banUser = useCallback(
    async (id, { reason, customReason, durationDays, isPermanent }) => {
      const now = new Date().toISOString();
      const finalReason =
        reason === 'OTHER' ? (customReason || '').trim() || 'Other' : reason || 'Moderation';
      const bannedUntil =
        isPermanent || durationDays == null ? null : addDaysIso(Number(durationDays) || 0);
      const snapshot = serverUsersRef.current;

      // Optimistic status update
      setServerUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: 'BANNED', updatedAt: now } : u)),
      );

      // Store display-only ban details in overlay
      setLocalOverlay((prev) => {
        const existing = prev[id] ?? {};
        const history = Array.isArray(existing.banHistory) ? [...existing.banHistory] : [];
        history.unshift({ at: now, reason: finalReason, durationDays: isPermanent ? null : durationDays });
        return {
          ...prev,
          [id]: { ...existing, banReason: finalReason, bannedUntil, banHistory: history },
        };
      });

      try {
        await adminUserApi.banUser(id);
      } catch {
        setServerUsers(snapshot);
      }
    },
    [],
  );

  const unbanUser = useCallback(async (id) => {
    const now = new Date().toISOString();
    const snapshot = serverUsersRef.current;

    setServerUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: 'ACTIVE', updatedAt: now } : u)),
    );

    setLocalOverlay((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), banReason: undefined, bannedUntil: undefined },
    }));

    try {
      await adminUserApi.unbanUser(id);
    } catch {
      setServerUsers(snapshot);
    }
  }, []);

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
