import { useCallback, useEffect, useMemo, useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import * as api from '../../utils/api';
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

  /** Tab "All posts": from API */
  const [allPosts, setAllPosts] = useState(fallbackPaginated);
  const [postsSearch, setPostsSearch] = useState('');
  const [postsPage, setPostsPage] = useState(0);
  const [postsSize, setPostsSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [organizationFilter, setOrganizationFilter] = useState('ALL');

  // Categories (real API)
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Topics (real API)
  const [topics, setTopics] = useState(fallbackPaginated);
  const [topicsSearch, setTopicsSearch] = useState('');
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
    const timer = setTimeout(loadStatistics, 0);
    return () => clearTimeout(timer);
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
    const timer = setTimeout(loadTopContributors, 0);
    return () => clearTimeout(timer);
  }, [loadTopContributors]);

  /* ─── Load monthly timeline (when year changes) ─── */

  const loadTimeline = useCallback(async () => {
    const data = await safeFetch(() => api.getMonthlyTimeline(timelineYear), null);
    setMonthlyTimeline(data);
  }, [timelineYear]);

  useEffect(() => {
    const timer = setTimeout(loadTimeline, 0);
    return () => clearTimeout(timer);
  }, [loadTimeline]);

  /* ─── Load banned posts ─── */

  const loadBannedPosts = useCallback(async () => {
    const data = await safeFetch(() => api.getBannedPosts(bannedPage, 10, activeOrgId || null), fallbackPaginated);
    setBannedPosts(normalizePaginated(data, 10));
  }, [bannedPage, activeOrgId]);

  useEffect(() => {
    const timer = setTimeout(loadBannedPosts, 0);
    return () => clearTimeout(timer);
  }, [loadBannedPosts]);

  /* ─── Load yesterday posts ─── */

  const loadYesterdayPosts = useCallback(async () => {
    const data = await safeFetch(
      () => api.getNewPostsYesterdayPaginated(yesterdayPage, 10, activeOrgId || null),
      fallbackPaginated,
    );
    setYesterdayPosts(normalizePaginated(data, 10));
  }, [yesterdayPage, activeOrgId]);

  useEffect(() => {
    const timer = setTimeout(loadYesterdayPosts, 0);
    return () => clearTimeout(timer);
  }, [loadYesterdayPosts]);

  const loadReports = useCallback(async () => {
    const data = await safeFetch(() => api.getPendingReports(reportsPage, 10, activeOrgId || null), fallbackPaginated);
    setReports(normalizePaginated(data, 10));
  }, [reportsPage, activeOrgId]);

  useEffect(() => {
    const timer = setTimeout(loadReports, 0);
    return () => clearTimeout(timer);
  }, [loadReports]);

  const loadAllPosts = useCallback(async () => {
    const allPayload = await safeFetch(() => api.getAllPosts(postsSearch, postsPage, postsSize, activeOrgId || null), fallbackPaginated);
    const paginated = normalizePaginated(allPayload, postsSize);
    const normalized = paginated.content.map(normalizePostRowForAdmin).filter(Boolean);
    setAllPosts({ ...paginated, content: normalized });
  }, [postsSearch, postsPage, postsSize, activeOrgId]);

  useEffect(() => {
    const timer = setTimeout(loadAllPosts, 0);
    return () => clearTimeout(timer);
  }, [loadAllPosts]);

  const posts = useMemo(() => {
    let list = allPosts.content;
    if (statusFilter !== 'ALL') {
      list = list.filter((post) => String(post.moderationStatus || '').toUpperCase() === statusFilter);
    }
    return list;
  }, [allPosts, statusFilter]);

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
      const timer = setTimeout(() => loadCategories(activeOrgId), 0);
      return () => clearTimeout(timer);
    }
  }, [activeOrgId, loadCategories]);

  /* ─── Load topics ─── */

  const loadTopics = useCallback(async (orgId) => {
    if (!orgId) return;
    setTopicsLoading(true);
    const data = await safeFetch(() => api.getAllTopics(orgId, topicsSearch, topicsPage, topicsSize), fallbackPaginated);
    setTopics(normalizePaginated(data, topicsSize));
    setTopicsLoading(false);
  }, [topicsSearch, topicsPage, topicsSize]);

  useEffect(() => {
    if (activeOrgId) {
      const timer = setTimeout(() => loadTopics(activeOrgId), 0);
      return () => clearTimeout(timer);
    }
  }, [activeOrgId, loadTopics]);

  /* ─── Mutation helpers ─── */

  const handleBanPost = useCallback(async (postId) => {
    try {
      await api.banPost(postId);
      await Promise.all([loadBannedPosts(), loadStatistics(), loadAllPosts()]);
      return true;
    } catch {
      return false;
    }
  }, [loadBannedPosts, loadStatistics, loadAllPosts]);

  const handleUnbanPost = useCallback(async (postId) => {
    try {
      await api.unbanPost(postId);
      await Promise.all([loadBannedPosts(), loadStatistics(), loadAllPosts()]);
      return true;
    } catch {
      return false;
    }
  }, [loadBannedPosts, loadStatistics, loadAllPosts]);

  const handleDeletePost = useCallback(async (postId) => {
    try {
      await api.deletePost(postId);
      await Promise.all([
        loadStatistics(),
        loadBannedPosts(),
        loadYesterdayPosts(),
        loadReports(),
        loadAllPosts(),
      ]);
      return true;
    } catch {
      return false;
    }
  }, [loadStatistics, loadBannedPosts, loadYesterdayPosts, loadReports, loadAllPosts]);

  const handleCreateCategory = useCallback(async (orgId, name, description, parentId) => {
    try {
      await api.createCategory(orgId, name, description, parentId);
      await loadCategories(orgId);
      return true;
    } catch {
      return false;
    }
  }, [loadCategories]);

  const handleUpdateCategory = useCallback(async (categoryId, name, description, parentId) => {
    try {
      await api.updateCategory(categoryId, name, description, parentId);
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
        loadAllPosts(),
      ]);
      return true;
    } catch {
      return false;
    }
  }, [loadReports, loadBannedPosts, loadYesterdayPosts, loadStatistics, loadAllPosts]);

  const handleUpdatePostVisibility = useCallback(async (postId, hidden, adminUserId) => {
    try {
      await api.updatePostVisibility(postId, { hidden, adminUserId });
      await Promise.all([loadBannedPosts(), loadYesterdayPosts(), loadReports(), loadAllPosts()]);
      return true;
    } catch {
      return false;
    }
  }, [loadBannedPosts, loadYesterdayPosts, loadReports, loadAllPosts]);

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
          loadAllPosts(),
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
    [adminUserId, loadAllPosts, loadBannedPosts, loadYesterdayPosts, loadStatistics],
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
    allPosts,
    postsPage,
    setPostsPage,
    postsSize,
    setPostsSize,
    posts,
    postsSearch,
    // setPostsSearch resets page to 0 to prevent stale-page bugs
    setPostsSearch: (kw) => { setPostsSearch(kw); setPostsPage(0); },
    statusFilter,
    setStatusFilter,
    organizationFilter,
    setOrganizationFilter,
    updatePostStatus,
    deletePost: handleDeletePost,

    // Categories
    categories,
    categoriesLoading,
    refreshCategories: () => activeOrgId && loadCategories(activeOrgId),

    // Topics
    topics,
    topicsSearch,
    // setTopicsSearch resets page to 0 to prevent stale-page bugs
    setTopicsSearch: (kw) => { setTopicsSearch(kw); setTopicsPage(0); },
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
