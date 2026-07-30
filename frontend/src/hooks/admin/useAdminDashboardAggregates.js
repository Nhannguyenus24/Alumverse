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

const useAdminDashboardAggregates = (allUsers, allPosts, organizations) => {
  const [now] = useState(() => Date.now());

  return useMemo(() => {
    const weekAgo = now - 7 * MS_DAY;
    const monthAgo = now - 30 * MS_DAY;

    const users = Array.isArray(allUsers) ? allUsers : [];
    const posts = Array.isArray(allPosts) ? allPosts : [];
    const orgs = Array.isArray(organizations) ? organizations : [];

    const usersWithCreated = users.map((u) => ({
      ...u,
      createdAt: normalizeCreatedAt(u, monthAgo),
    }));

    const totalUsers = usersWithCreated.length;
    const newUsersWeek = usersWithCreated.filter((u) => new Date(u.createdAt).getTime() >= weekAgo).length;
    const newUsersMonth = usersWithCreated.filter((u) => new Date(u.createdAt).getTime() >= monthAgo).length;

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

    const userGrowthDays = 30;
    const userGrowthSeries = [];
    for (let i = userGrowthDays - 1; i >= 0; i -= 1) {
      const dayStart = startOfLocalDay(now - i * MS_DAY);
      const dayEnd = dayStart + MS_DAY;
      const count = usersWithCreated.filter((u) => {
        const t = new Date(u.createdAt).getTime();
        return t >= dayStart && t < dayEnd;
      }).length;
      userGrowthSeries.push({
        date: formatDayLabel(dayStart),
        count,
      });
    }

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

    const forumDaySpan = 7;
    const forumPostsByDay = [];
    for (let i = forumDaySpan - 1; i >= 0; i -= 1) {
      const dayStart = startOfLocalDay(now - i * MS_DAY);
      const dayEnd = dayStart + MS_DAY;
      const count = postsWithPostedAt.filter((p) => {
        const t = new Date(p.postedAt).getTime();
        return t >= dayStart && t < dayEnd;
      }).length;
      forumPostsByDay.push({
        date: formatDayLabel(dayStart),
        count,
      });
    }

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
        newUsersWeek,
        newUsersMonth,
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
  }, [allUsers, allPosts, organizations, now]);
};

export default useAdminDashboardAggregates;
