import { useCallback, useEffect, useMemo, useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import * as api from '../../api/adminForumApi';
import { useAuth } from '../useAuth';

/* ─── Fallback data (used when API is unavailable) ─── */

const fallbackStatistics = {
  totalTopics: 0,
  totalPosts: 0,
  totalCategories: 0,
  bannedPosts: 0,
  newTopicsToday: 0,
  newPostsToday: 0,
  mostPopularTopic: null,
  mostPopularCategory: null,
  ghostTopics: [],
};

const fallbackPaginated = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 };

const normalizePaginated = (payload, fallbackSize = 10) => {
  if (!payload || typeof payload !== 'object') return fallbackPaginated;
  if (Array.isArray(payload.content)) {
    return {
      content: payload.content,
      totalElements: payload.totalElements ?? payload.totalItem ?? payload.content.length,
      totalPages: payload.totalPages ?? payload.totalPage ?? 0,
      number: payload.number ?? payload.currentPage ?? 0,
      size: payload.size ?? payload.pageSize ?? fallbackSize,
    };
  }
  if (Array.isArray(payload.items)) {
    return {
      content: payload.items,
      totalElements: payload.totalItem ?? payload.totalElements ?? payload.items.length,
      totalPages: payload.totalPage ?? payload.totalPages ?? 0,
      number: payload.currentPage ?? payload.number ?? 0,
      size: payload.pageSize ?? payload.size ?? fallbackSize,
    };
  }
  return fallbackPaginated;
};

/* ─── Helpers ─── */

const extractData = (response) => response?.data?.data ?? response?.data ?? null;

const safeFetch = async (request, fallback) => {
  try {
    const data = extractData(await request());
    return data ?? fallback;
  } catch {
    return fallback;
  }
};

const normalizePostRowForAdmin = (dto) => {
  if (!dto || dto.id == null) return null;
  const banned = dto.isBanned === true || dto.isBanned === 'true';
  const hidden = dto.isHidden === true || dto.isHidden === 'true';
  let moderationStatus = 'APPROVED';
  if (banned) moderationStatus = 'REJECTED';
  else if (hidden) moderationStatus = 'FLAGGED';

  return {
    ...dto,
    postedAt: dto.postedAt || dto.createdAt,
    moderationStatus,
    authorName: dto.authorName ?? (dto.authorMemberId != null ? `Member #${dto.authorMemberId}` : '-'),
    topicTitle: dto.topicTitle ?? (dto.topicId != null ? `Topic #${dto.topicId}` : '-'),
    categoryName: dto.categoryName ?? '-',
    flagsCount: Number(dto.flagsCount) || 0,
  };
};

/* ─── Hook ─── */

const useAdminForumData = (activeOrgId) => {
  const { user } = useAuth();
  const adminUserId = Number(user?.id);

  const [loading, setLoading] = useState(true);

  // Statistics
  const [statistics, setStatistics] = useState(fallbackStatistics);
  const [topContributors, setTopContributors] = useState([]);
  const [organizationEngagement, setOrganizationEngagement] = useState([]);
  const [monthlyTimeline, setMonthlyTimeline] = useState(null);

  // Selectors for top-contributors & timeline
  const now = new Date();
  const [contributorMonth, setContributorMonth] = useState(now.getMonth() + 1);
  const [contributorYear, setContributorYear] = useState(now.getFullYear());
  const [timelineYear, setTimelineYear] = useState(now.getFullYear());

  // Posts
  const [bannedPosts, setBannedPosts] = useState(fallbackPaginated);
  const [bannedPage, setBannedPage] = useState(0);
  const [yesterdayPosts, setYesterdayPosts] = useState(fallbackPaginated);
  const [yesterdayPage, setYesterdayPage] = useState(0);
  const [reports, setReports] = useState(fallbackPaginated);
  const [reportsPage, setReportsPage] = useState(0);

  /** Tab "All posts": merged from API (yesterday + banned); no mock data. */
  const [mergedModerationPosts, setMergedModerationPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Categories (real API)
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Topics (real API)
  const [topics, setTopics] = useState(fallbackPaginated);
  const [topicsPage, setTopicsPage] = useState(0);
  const [topicsSize, setTopicsSize] = useState(10);
  const [topicsLoading, setTopicsLoading] = useState(false);

  /* ─── Load statistics (once) ─── */

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    const [stats, engagement] = await Promise.all([
      safeFetch(() => api.getForumStatistics(), fallbackStatistics),
      safeFetch(() => api.getOrganizationEngagement(), []),
    ]);
    setStatistics(stats);
    setOrganizationEngagement(Array.isArray(engagement) ? engagement : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  /* ─── Load top contributors (when month/year changes) ─── */

  const loadTopContributors = useCallback(async () => {
    const data = await safeFetch(
      () => api.getTopContributors(contributorMonth, contributorYear),
      [],
    );
    setTopContributors(Array.isArray(data) ? data : []);
  }, [contributorMonth, contributorYear]);

  useEffect(() => {
    loadTopContributors();
  }, [loadTopContributors]);

  /* ─── Load monthly timeline (when year changes) ─── */

  const loadTimeline = useCallback(async () => {
    const data = await safeFetch(() => api.getMonthlyTimeline(timelineYear), null);
    setMonthlyTimeline(data);
  }, [timelineYear]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  /* ─── Load banned posts ─── */

  const loadBannedPosts = useCallback(async () => {
    const data = await safeFetch(() => api.getBannedPosts(bannedPage, 10), fallbackPaginated);
    setBannedPosts(normalizePaginated(data, 10));
  }, [bannedPage]);

  useEffect(() => {
    loadBannedPosts();
  }, [loadBannedPosts]);

  /* ─── Load yesterday posts ─── */

  const loadYesterdayPosts = useCallback(async () => {
    const data = await safeFetch(
      () => api.getNewPostsYesterdayPaginated(yesterdayPage, 10),
      fallbackPaginated,
    );
    setYesterdayPosts(normalizePaginated(data, 10));
  }, [yesterdayPage]);

  useEffect(() => {
    loadYesterdayPosts();
  }, [loadYesterdayPosts]);

  const loadReports = useCallback(async () => {
    const data = await safeFetch(() => api.getPendingReports(reportsPage, 10), fallbackPaginated);
    setReports(normalizePaginated(data, 10));
  }, [reportsPage]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const loadMergedModerationPosts = useCallback(async () => {
    const allPayload = await safeFetch(() => api.getAllPosts(0, 200), fallbackPaginated);
    const all = normalizePaginated(allPayload, 200).content;
    const normalized = (Array.isArray(all) ? all : [])
      .map(normalizePostRowForAdmin)
      .filter(Boolean)
      .sort((a, b) => {
        const ta = new Date(a.postedAt || a.createdAt || 0).getTime();
        const tb = new Date(b.postedAt || b.createdAt || 0).getTime();
        return tb - ta;
      });
    setMergedModerationPosts(normalized);
  }, []);

  useEffect(() => {
    loadMergedModerationPosts();
  }, [loadMergedModerationPosts]);

  const posts = useMemo(() => {
    let list = mergedModerationPosts;
    if (statusFilter !== 'ALL') {
      list = list.filter((post) => String(post.moderationStatus || '').toUpperCase() === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((post) => {
      const haystack = [post.topicTitle, post.authorName, post.content, String(post.id)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [mergedModerationPosts, statusFilter, search]);

  /* ─── Load categories ─── */

  const loadCategories = useCallback(async (orgId) => {
    if (!orgId) return;
    setCategoriesLoading(true);
    const data = await safeFetch(() => api.getAllCategories(orgId), []);
    setCategories(Array.isArray(data) ? data : []);
    setCategoriesLoading(false);
  }, []);

  useEffect(() => {
    if (activeOrgId) {
      loadCategories(activeOrgId);
    }
  }, [activeOrgId, loadCategories]);

  /* ─── Load topics ─── */

  const loadTopics = useCallback(async (orgId) => {
    if (!orgId) return;
    setTopicsLoading(true);
    const data = await safeFetch(() => api.getAllTopics(orgId, topicsPage, topicsSize), fallbackPaginated);
    setTopics(normalizePaginated(data, topicsSize));
    setTopicsLoading(false);
  }, [topicsPage, topicsSize]);

  useEffect(() => {
    if (activeOrgId) {
      loadTopics(activeOrgId);
    }
  }, [activeOrgId, loadTopics]);

  /* ─── Mutation helpers ─── */

  const handleBanPost = useCallback(async (postId) => {
    try {
      await api.banPost(postId);
      await Promise.all([loadBannedPosts(), loadStatistics(), loadMergedModerationPosts()]);
      return true;
    } catch {
      return false;
    }
  }, [loadBannedPosts, loadStatistics, loadMergedModerationPosts]);

  const handleUnbanPost = useCallback(async (postId) => {
    try {
      await api.unbanPost(postId);
      await Promise.all([loadBannedPosts(), loadStatistics(), loadMergedModerationPosts()]);
      return true;
    } catch {
      return false;
    }
  }, [loadBannedPosts, loadStatistics, loadMergedModerationPosts]);

  const handleDeletePost = useCallback(async (postId) => {
    try {
      await api.deletePost(postId);
      await Promise.all([
        loadStatistics(),
        loadBannedPosts(),
        loadYesterdayPosts(),
        loadReports(),
        loadMergedModerationPosts(),
      ]);
      return true;
    } catch {
      return false;
    }
  }, [loadStatistics, loadBannedPosts, loadYesterdayPosts, loadReports, loadMergedModerationPosts]);

  const handleCreateCategory = useCallback(async (orgId, name, description) => {
    try {
      await api.createCategory(orgId, name, description);
      await loadCategories(orgId);
      return true;
    } catch {
      return false;
    }
  }, [loadCategories]);

  const handleUpdateCategory = useCallback(async (categoryId, name, description) => {
    try {
      await api.updateCategory(categoryId, name, description);
      if (activeOrgId) await loadCategories(activeOrgId);
      return true;
    } catch {
      return false;
    }
  }, [activeOrgId, loadCategories]);

  const handleDeleteCategory = useCallback(async (categoryId) => {
    try {
      await api.deleteCategory(categoryId);
      if (activeOrgId) await loadCategories(activeOrgId);
      return true;
    } catch {
      return false;
    }
  }, [activeOrgId, loadCategories]);

  const handleCreateTopic = useCallback(async (orgId, categoryId, title, memberId) => {
    try {
      await api.createTopic(orgId, categoryId, title, memberId);
      await loadTopics(orgId);
      return true;
    } catch {
      return false;
    }
  }, [loadTopics]);

  const handleUpdateTopic = useCallback(async (topicId, title, categoryId) => {
    try {
      await api.updateTopic(topicId, title, categoryId);
      if (activeOrgId) await loadTopics(activeOrgId);
      return true;
    } catch {
      return false;
    }
  }, [activeOrgId, loadTopics]);

  const handleDeleteTopic = useCallback(async (topicId) => {
    try {
      await api.deleteTopic(topicId);
      if (activeOrgId) await loadTopics(activeOrgId);
      return true;
    } catch {
      return false;
    }
  }, [activeOrgId, loadTopics]);

  const handleReviewReport = useCallback(async (reportId, payload) => {
    try {
      await api.reviewReport(reportId, payload);
      await Promise.all([
        loadReports(),
        loadBannedPosts(),
        loadYesterdayPosts(),
        loadStatistics(),
        loadMergedModerationPosts(),
      ]);
      return true;
    } catch {
      return false;
    }
  }, [loadReports, loadBannedPosts, loadYesterdayPosts, loadStatistics, loadMergedModerationPosts]);

  const handleUpdatePostVisibility = useCallback(async (postId, hidden, adminUserId) => {
    try {
      await api.updatePostVisibility(postId, { hidden, adminUserId });
      await Promise.all([loadBannedPosts(), loadYesterdayPosts(), loadReports(), loadMergedModerationPosts()]);
      return true;
    } catch {
      return false;
    }
  }, [loadBannedPosts, loadYesterdayPosts, loadReports, loadMergedModerationPosts]);

  const handleUpdateTopicLock = useCallback(async (topicId, locked, adminUserId) => {
    try {
      await api.updateTopicLock(topicId, { locked, adminUserId });
      if (activeOrgId) {
        await loadTopics(activeOrgId);
      }
      return true;
    } catch {
      return false;
    }
  }, [activeOrgId, loadTopics]);

  const updatePostStatus = useCallback(
    async (postId, status) => {
      const s = String(status || '').toUpperCase();
      if (!adminUserId) {
        enqueueSnackbar('Sign in to moderate posts.', { variant: 'error' });
        return;
      }
      try {
        if (s === 'APPROVED' || s === 'PENDING') {
          await api.unbanPost(postId);
          await api.updatePostVisibility(postId, { hidden: false, adminUserId });
        } else if (s === 'REJECTED') {
          await api.banPost(postId);
        } else if (s === 'FLAGGED') {
          await api.updatePostVisibility(postId, { hidden: true, adminUserId });
        } else {
          enqueueSnackbar('Unsupported moderation status.', { variant: 'warning' });
          return;
        }
        await Promise.all([
          loadMergedModerationPosts(),
          loadBannedPosts(),
          loadYesterdayPosts(),
          loadStatistics(),
        ]);
        enqueueSnackbar('Post moderation updated.', { variant: 'success' });
      } catch (e) {
        enqueueSnackbar(e?.response?.data?.message || 'Failed to update post.', { variant: 'error' });
        throw e;
      }
    },
    [adminUserId, loadMergedModerationPosts, loadBannedPosts, loadYesterdayPosts, loadStatistics],
  );

  return {
    loading,

    // Statistics
    statistics,
    topContributors,
    organizationEngagement,
    monthlyTimeline,

    // Selectors
    contributorMonth,
    setContributorMonth,
    contributorYear,
    setContributorYear,
    timelineYear,
    setTimelineYear,

    // Banned posts
    bannedPosts,
    bannedPage,
    setBannedPage,

    // Yesterday posts
    yesterdayPosts,
    yesterdayPage,
    setYesterdayPage,
    reports,
    reportsPage,
    setReportsPage,

    // All posts tab (API-backed)
    allPosts: mergedModerationPosts,
    posts,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    updatePostStatus,
    deletePost: handleDeletePost,

    // Categories
    categories,
    categoriesLoading,
    refreshCategories: () => activeOrgId && loadCategories(activeOrgId),

    // Topics
    topics,
    topicsPage,
    setTopicsPage,
    topicsSize,
    setTopicsSize,
    topicsLoading,
    refreshTopics: () => activeOrgId && loadTopics(activeOrgId),

    // Mutations
    banPost: handleBanPost,
    unbanPost: handleUnbanPost,
    deletePostApi: handleDeletePost,
    createCategory: handleCreateCategory,
    updateCategory: handleUpdateCategory,
    deleteCategory: handleDeleteCategory,
    createTopic: handleCreateTopic,
    updateTopic: handleUpdateTopic,
    deleteTopic: handleDeleteTopic,
    reviewReport: handleReviewReport,
    updatePostVisibility: handleUpdatePostVisibility,
    updateTopicLock: handleUpdateTopicLock,

    // Reload
    reloadStatistics: loadStatistics,
  };
};

export default useAdminForumData;
