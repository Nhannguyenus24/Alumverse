import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import i18next from 'i18next';
import * as adminUserApi from '../../utils/api';

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

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const compactObject = (obj) => Object.fromEntries(
  Object.entries(obj).filter(([, value]) => value !== undefined),
);

const toComparable = (value) => {
  if (Array.isArray(value)) {
    const normalized = value
      .map(toComparable)
      .filter((item) => item !== null && item !== '');
    return normalized.length === 1 ? normalized[0] : normalized;
  }
  if (typeof value === 'string') return value.trim();
  if (value === '') return null;
  return value ?? null;
};

const sameValue = (left, right) => JSON.stringify(toComparable(left)) === JSON.stringify(toComparable(right));

const useAdminUsersLocal = (stableOrgId, shouldFetch = true) => {
  // ── Server-fetched users ──────────────────────────────────────────────────
  const [serverUsers, setServerUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Local overlay for fields the backend doesn't return (fullName, orgId, ban details…)
  const [localOverlay, setLocalOverlay] = useState({});

  // ── Filter / sort / pagination state ────────────────────────────────────
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // ── Load from API ─────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const orgId = stableOrgId || null;
      const res = await adminUserApi.getUsers(page, rowsPerPage, search, roleFilter, statusFilter, orgId);
      const payload = res?.data?.data;
      const items = normalizeList(payload);
      setServerUsers(Array.isArray(items) ? items : []);
      setTotalCount(payload?.totalItem || payload?.totalElements || items.length || 0);
    } catch {
      setServerUsers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, roleFilter, statusFilter, stableOrgId]);

  useEffect(() => {
    if (shouldFetch) {
      loadUsers();
    }
  }, [loadUsers, shouldFetch]);

  // ── Merged view ───────────────────────────────────────────────────────────
  const allUsers = useMemo(() => {
    const merged = serverUsers.map((u) => ({
      ...u,
      ...(localOverlay[u.id] ?? {}),
    }));
    return merged;
  }, [serverUsers, localOverlay]);

  // Since we are doing server-side filtering, users are already the paged ones
  const pagedUsers = allUsers;
  const sortedUsers = allUsers;

  // ── Helpers ───────────────────────────────────────────────────────────────
  // Keep a ref snapshot for optimistic-revert patterns
  const serverUsersRef = useRef(serverUsers);
  useEffect(() => { serverUsersRef.current = serverUsers; }, [serverUsers]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createUser = useCallback(async (payload) => {
    try {
      await adminUserApi.addOrganizationMember({
        email: String(payload.email || '').trim(),
        studentId: String(payload.studentId || '').trim(),
        fullName: String(payload.fullName || '').trim(),
        role: payload.role,
        status: payload.status,
        organizationId: Number(payload.organizationId),
        verificationLevel: Number(payload.verificationLevel ?? 0),
        isTrustedVerifier: Boolean(payload.isTrustedVerifier),
        faculty: payload.faculty,
        program: payload.program,
        major: payload.major,
        startedYear: payload.startedYear,
        graduatedYear: payload.graduatedYear,
        graduationStatus: payload.graduationStatus,
        password: payload.password,
      });
      enqueueSnackbar('User account created and added to organization.', { variant: 'success' });
      await loadUsers();
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to create user.';
      enqueueSnackbar(msg, { variant: 'error' });
      throw e;
    }
  }, [loadUsers]);

  const bulkImportUsers = useCallback(async ({ organizationId, members }) => {
    try {
      const res = await adminUserApi.bulkImportMembers({ organizationId, members });
      const data = res?.data?.data ?? res?.data ?? res;
      enqueueSnackbar(
        i18next.t('admin:bulk_result_summary', {
          success: data.successCount ?? 0,
          failure: data.failureCount ?? 0,
        }),
        { variant: data.failureCount === 0 ? 'success' : 'warning' }
      );
      await loadUsers();
      return data;
    } catch (e) {
      const msg = e?.response?.data?.message || i18next.t('admin:bulk_import_error');
      enqueueSnackbar(msg, { variant: 'error' });
      throw e;
    }
  }, [loadUsers]);

  const updateUser = useCallback(
    async (id, payload) => {
      const uid = Number(id);
      const snapshot = serverUsersRef.current;
      const {
        password,
        organizationId,
        organizationName: _orgName,
        membershipStatus: _membershipStatus,
        isTrustedVerifier,
        ...rest
      } = payload;
      const now = new Date().toISOString();
      const currentUser = snapshot.find((u) => Number(u.id) === uid) ?? {};

      const explicitOrganizationNumber = organizationId !== undefined && organizationId !== '' && !Number.isNaN(Number(organizationId))
        ? Number(organizationId)
        : undefined;
      const currentOrganizationNumber = currentUser.organizationId !== undefined && currentUser.organizationId !== null && !Number.isNaN(Number(currentUser.organizationId))
        ? Number(currentUser.organizationId)
        : undefined;
      const organizationNumber = explicitOrganizationNumber ?? currentOrganizationNumber;

      const desired = compactObject({
        email: rest.email !== undefined ? String(rest.email || '').trim() : undefined,
        fullName: rest.fullName !== undefined ? String(rest.fullName || '').trim() : undefined,
        studentId: rest.studentId !== undefined ? String(rest.studentId || '').trim() : undefined,
        role: rest.role,
        status: rest.status,
        verificationLevel: rest.verificationLevel !== undefined ? Number(rest.verificationLevel) : undefined,
        faculty: rest.faculty,
        department: rest.department,
        program: rest.program,
        major: rest.major,
        startedYear: rest.startedYear,
        graduatedYear: rest.graduatedYear,
        graduationStatus: rest.graduationStatus,
        organizationId: organizationNumber,
        isTrustedVerifier: typeof isTrustedVerifier === 'boolean' ? isTrustedVerifier : undefined,
      });

      const shouldSend = (key, value) => {
        if (value === undefined) return false;

        const currentValue = currentUser[key];
        if (!hasOwn(currentUser, key) || currentValue === undefined || currentValue === null) {
          if (key === 'isTrustedVerifier') return value === true;
          if (key === 'verificationLevel') return Number(value) !== 0;
          if (key === 'organizationId') return false;
          if (Array.isArray(value)) return value.length > 0;
          return typeof value === 'string' ? value.trim() !== '' : value !== null;
        }

        return !sameValue(currentValue, value);
      };

      const body = compactObject({
        email: shouldSend('email', desired.email) ? desired.email : undefined,
        fullName: shouldSend('fullName', desired.fullName) ? desired.fullName : undefined,
        studentId: shouldSend('studentId', desired.studentId) ? desired.studentId : undefined,
        role: shouldSend('role', desired.role) ? desired.role : undefined,
        status: shouldSend('status', desired.status) ? desired.status : undefined,
        verificationLevel: shouldSend('verificationLevel', desired.verificationLevel) ? desired.verificationLevel : undefined,
        faculty: shouldSend('faculty', desired.faculty) ? desired.faculty : undefined,
        program: shouldSend('program', desired.program) ? desired.program : undefined,
        major: shouldSend('major', desired.major) ? desired.major : undefined,
        startedYear: shouldSend('startedYear', desired.startedYear) ? desired.startedYear : undefined,
        graduatedYear: shouldSend('graduatedYear', desired.graduatedYear) ? desired.graduatedYear : undefined,
        graduationStatus: shouldSend('graduationStatus', desired.graduationStatus) ? desired.graduationStatus : undefined,
      });

      setServerUsers((prev) =>
        prev.map((u) =>
          Number(u.id) === uid
            ? {
                ...u,
                ...rest,
                ...(typeof isTrustedVerifier === 'boolean' ? { isTrustedVerifier } : {}),
                updatedAt: now,
              }
            : u,
        ),
      );

      try {
        if (Object.keys(body).length > 0) {
          await adminUserApi.updateUser(uid, body);
        }

        if (
          organizationNumber !== undefined &&
          typeof isTrustedVerifier === 'boolean' &&
          (
            hasOwn(currentUser, 'isTrustedVerifier')
              ? Boolean(currentUser.isTrustedVerifier) !== isTrustedVerifier
              : true
          )
        ) {
          await adminUserApi.updateTrustedVerifier(uid, organizationNumber, isTrustedVerifier);
        }

        if (password) {
          await adminUserApi.resetPasswordByAdmin(uid, password);
        }

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
      if (status === 'ACTIVE') {
        await adminUserApi.unbanUser(uid);
      } else if (status === 'BANNED') {
        await adminUserApi.banUser(uid);
      } else if (status === 'DELETED') {
        await adminUserApi.deleteUser(uid, false);
      } else {
        await adminUserApi.updateUser(uid, { status });
      }
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

  return useMemo(() => ({
    loading,
    allUsers,
    totalCount,
    filteredCount: totalCount,
    users: pagedUsers,
    sortedUsers,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
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
    createUser,
    bulkImportUsers,
    updateUser,
    updateUserStatus,
    deleteUser,
    banUser,
    unbanUser,
    reloadUsers: loadUsers,
  }), [
    loading, allUsers, totalCount, pagedUsers, sortedUsers,
    search, roleFilter, statusFilter, sortBy, sortOrder, page, rowsPerPage,
    createUser, bulkImportUsers, updateUser, updateUserStatus, deleteUser, banUser, unbanUser, loadUsers
  ]);
};

export default useAdminUsersLocal;
