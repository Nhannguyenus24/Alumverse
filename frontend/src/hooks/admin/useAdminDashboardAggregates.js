import { useMemo, useState } from 'react';

const MS_DAY = 24 * 60 * 60 * 1000;

const FORUM_STATUS_ORDER = ['PENDING', 'FLAGGED', 'APPROVED', 'REJECTED'];

const FORUM_STATUS_LABELS = {
  PENDING: 'Pending',
  FLAGGED: 'Flagged',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const startOfLocalDay = (ts) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const formatDayLabel = (ts) =>
  new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const normalizeCreatedAt = (user, fallbackTs) => {
  if (user.createdAt) {
    return user.createdAt;
  }
  return new Date(fallbackTs).toISOString();
};

// Daily buckets spanning [rangeStart, rangeEnd] (local days). Range-based charts
// (registrations, forum posts) use this so they follow the selected window.
const buildDailySeries = (items, getTs, rangeStart, rangeEnd) => {
  const series = [];
  const cursor = startOfLocalDay(rangeStart);
  const lastDay = startOfLocalDay(rangeEnd);
  let guard = 0;
  for (let dayStart = cursor; dayStart <= lastDay && guard < 400; dayStart += MS_DAY, guard += 1) {
    const dayEnd = dayStart + MS_DAY;
    const count = items.filter((it) => {
      const t = new Date(getTs(it)).getTime();
      return t >= dayStart && t < dayEnd;
    }).length;
    series.push({ date: formatDayLabel(dayStart), count });
  }
  return series;
};

const useAdminDashboardAggregates = (allUsers, allPosts, organizations, from, to) => {
  const [now] = useState(() => Date.now());

  return useMemo(() => {
    const monthAgo = now - 30 * MS_DAY;
    // Selected window (falls back to the last 30 days).
    const rangeEnd = to ? new Date(to).getTime() : now;
    const rangeStart = from ? new Date(from).getTime() : monthAgo;

    const users = Array.isArray(allUsers) ? allUsers : [];
    const posts = Array.isArray(allPosts) ? allPosts : [];
    const orgs = Array.isArray(organizations) ? organizations : [];

    const usersWithCreated = users.map((u) => ({
      ...u,
      createdAt: normalizeCreatedAt(u, monthAgo),
    }));

    const totalUsers = usersWithCreated.length;
    // Range-based: members that joined within the selected window.
    const newUsersInRange = usersWithCreated.filter((u) => {
      const t = new Date(u.createdAt).getTime();
      return t >= rangeStart && t <= rangeEnd;
    }).length;

    let activeUsers = 0;
    let inactiveUsers = 0;
    let bannedUsers = 0;
    usersWithCreated.forEach((u) => {
      const s = String(u.status || '').toUpperCase();
      if (s === 'ACTIVE') {
        activeUsers += 1;
      } else if (s === 'BANNED') {
        bannedUsers += 1;
      } else if (s === 'INACTIVE') {
        inactiveUsers += 1;
      } else {
        inactiveUsers += 1;
      }
    });

    const userGrowthSeries = buildDailySeries(
      usersWithCreated,
      (u) => u.createdAt,
      rangeStart,
      rangeEnd,
    );

    const totalPosts = posts.length;
    const totalFlags = posts.reduce((acc, p) => acc + (Number(p.flagsCount) || 0), 0);

    const forumByStatus = FORUM_STATUS_ORDER.reduce((acc, k) => {
      acc[k] = 0;
      return acc;
    }, {});

    posts.forEach((p) => {
      const k = String(p.moderationStatus || 'PENDING').toUpperCase();
      if (forumByStatus[k] !== undefined) {
        forumByStatus[k] += 1;
      } else {
        forumByStatus.PENDING += 1;
      }
    });

    const forumModerationBar = FORUM_STATUS_ORDER.map((k) => ({
      name: FORUM_STATUS_LABELS[k],
      count: forumByStatus[k],
    }));

    const forumModerationPie = FORUM_STATUS_ORDER.map((k) => ({
      name: FORUM_STATUS_LABELS[k],
      value: forumByStatus[k],
    }));

    const postsWithPostedAt = posts.map((p) => ({
      ...p,
      postedAt: p.postedAt || new Date(now).toISOString(),
    }));

    const forumPostsByDay = buildDailySeries(
      postsWithPostedAt,
      (p) => p.postedAt,
      rangeStart,
      rangeEnd,
    );

    const totalOrganizations = orgs.length;
    let activeOrganizations = 0;
    let inactiveOrganizations = 0;

    const orgMemberCounts = {};
    allUsers.forEach((u) => {
      const oid = u.organizationId || u.organization_id;
      if (oid) {
        orgMemberCounts[oid] = (orgMemberCounts[oid] || 0) + 1;
      }
    });

    const enrichedOrgs = orgs.map((o) => ({
      ...o,
      members: orgMemberCounts[o.id] || 0
    }));

    enrichedOrgs.forEach((o) => {
      if (String(o.status || 'ACTIVE').toUpperCase() === 'ACTIVE') {
        activeOrganizations += 1;
      } else {
        inactiveOrganizations += 1;
      }
    });

    const topOrganizationsByMembers = [...enrichedOrgs]
      .sort((a, b) => (Number(b.members) || 0) - (Number(a.members) || 0))
      .slice(0, 5);

    const activeOrganizationsList = enrichedOrgs
      .filter((o) => String(o.status || 'ACTIVE').toUpperCase() === 'ACTIVE')
      .slice(0, 6);

    return {
      user: {
        totalUsers,
        newUsersInRange,
        activeUsers,
        inactiveUsers,
        bannedUsers,
        userGrowthSeries,
      },
      forum: {
        totalPosts,
        totalFlags,
        pending: forumByStatus.PENDING,
        flagged: forumByStatus.FLAGGED,
        approved: forumByStatus.APPROVED,
        rejected: forumByStatus.REJECTED,
        forumPostsByDay,
        forumModerationBar,
        forumModerationPie,
      },
      organization: {
        totalOrganizations,
        activeOrganizations,
        inactiveOrganizations,
        topOrganizationsByMembers,
        activeOrganizationsList,
      },
    };
  }, [allUsers, allPosts, organizations, now, from, to]);
};

export default useAdminDashboardAggregates;
