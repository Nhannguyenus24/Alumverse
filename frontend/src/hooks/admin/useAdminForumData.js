import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
  } catch (err) {
    if (err.name === 'CanceledError' || err.name === 'AbortError') {
      throw err;
    }
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
    authorName: dto.authorName ?? null,
    topicTitle: dto.topicTitle ?? (dto.topicId != null ? `Topic #${dto.topicId}` : '-'),
    categoryName: dto.categoryName ?? '-',
    flagsCount: Number(dto.flagsCount) || 0,
  };
};

/* ─── Hook ─── */

const useAdminForumData = (activeOrgId, shouldFetch = true) => {
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
    if (!shouldFetch) return;
    const timer = setTimeout(loadStatistics, 0);
    return () => clearTimeout(timer);
  }, [loadStatistics, shouldFetch]);

  /* ─── Load top contributors (when month/year changes) ─── */

  const loadTopContributors = useCallback(async () => {
    const data = await safeFetch(
      () => api.getTopContributors(contributorMonth, contributorYear),
      [],
    );
    setTopContributors(Array.isArray(data) ? data : []);
  }, [contributorMonth, contributorYear]);

  useEffect(() => {
    if (!shouldFetch) return;
    const timer = setTimeout(loadTopContributors, 0);
    return () => clearTimeout(timer);
  }, [loadTopContributors, shouldFetch]);

  /* ─── Load monthly timeline (when year changes) ─── */

  const loadTimeline = useCallback(async () => {
    const data = await safeFetch(() => api.getMonthlyTimeline(timelineYear), null);
    setMonthlyTimeline(data);
  }, [timelineYear]);

  useEffect(() => {
    if (!shouldFetch) return;
    const timer = setTimeout(loadTimeline, 0);
    return () => clearTimeout(timer);
  }, [loadTimeline, shouldFetch]);

  /* ─── Load banned posts ─── */

  const bannedAbortRef = useRef(null);
  const loadBannedPosts = useCallback(async () => {
    bannedAbortRef.current?.abort();
    bannedAbortRef.current = new AbortController();
    const config = { signal: bannedAbortRef.current.signal };
    try {
      const data = await safeFetch(() => api.getBannedPosts(bannedPage, 10, activeOrgId || null, config), fallbackPaginated);
      if (!config.signal.aborted) setBannedPosts(normalizePaginated(data, 10));
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        setBannedPosts(fallbackPaginated);
      }
    }
  }, [bannedPage, activeOrgId]);

  useEffect(() => {
    if (!shouldFetch) return;
    const timer = setTimeout(loadBannedPosts, 0);
    return () => clearTimeout(timer);
  }, [loadBannedPosts, shouldFetch]);

  /* ─── Load yesterday posts ─── */

  const yesterdayAbortRef = useRef(null);
  const loadYesterdayPosts = useCallback(async () => {
    yesterdayAbortRef.current?.abort();
    yesterdayAbortRef.current = new AbortController();
    const config = { signal: yesterdayAbortRef.current.signal };
    try {
      const data = await safeFetch(
        () => api.getNewPostsYesterdayPaginated(yesterdayPage, 10, activeOrgId || null, config),
        fallbackPaginated,
      );
      if (!config.signal.aborted) setYesterdayPosts(normalizePaginated(data, 10));
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        setYesterdayPosts(fallbackPaginated);
      }
    }
  }, [yesterdayPage, activeOrgId]);

  useEffect(() => {
    if (!shouldFetch) return;
    const timer = setTimeout(loadYesterdayPosts, 0);
    return () => clearTimeout(timer);
  }, [loadYesterdayPosts, shouldFetch]);

  const reportsAbortRef = useRef(null);
  const loadReports = useCallback(async () => {
    reportsAbortRef.current?.abort();
    reportsAbortRef.current = new AbortController();
    const config = { signal: reportsAbortRef.current.signal };
    try {
      const data = await safeFetch(() => api.getPendingReports(reportsPage, 10, activeOrgId || null, config), fallbackPaginated);
      if (!config.signal.aborted) setReports(normalizePaginated(data, 10));
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        setReports(fallbackPaginated);
      }
    }
  }, [reportsPage, activeOrgId]);

  useEffect(() => {
    if (!shouldFetch) return;
    const timer = setTimeout(loadReports, 0);
    return () => clearTimeout(timer);
  }, [loadReports, shouldFetch]);

  const allPostsAbortRef = useRef(null);
  const loadAllPosts = useCallback(async () => {
    allPostsAbortRef.current?.abort();
    allPostsAbortRef.current = new AbortController();
    const config = { signal: allPostsAbortRef.current.signal };
    try {
      const allPayload = await safeFetch(() => api.getAllPosts(postsSearch, postsPage, postsSize, activeOrgId || null, config), fallbackPaginated);
      if (!config.signal.aborted) {
        const paginated = normalizePaginated(allPayload, postsSize);
        const normalized = paginated.content.map(normalizePostRowForAdmin).filter(Boolean);
        setAllPosts({ ...paginated, content: normalized });
      }
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        setAllPosts(fallbackPaginated);
      }
    }
  }, [postsSearch, postsPage, postsSize, activeOrgId]);

  useEffect(() => {
    if (!shouldFetch) return;
    const timer = setTimeout(loadAllPosts, 0);
    return () => clearTimeout(timer);
  }, [loadAllPosts, shouldFetch]);

  const posts = useMemo(() => {
    let list = allPosts.content;
    if (statusFilter !== 'ALL') {
      list = list.filter((post) => String(post.moderationStatus || '').toUpperCase() === statusFilter);
    }
    return list;
  }, [allPosts, statusFilter]);

  /* ─── Load categories ─── */

  const categoriesAbortRef = useRef(null);
  const loadCategories = useCallback(async (orgId) => {
    if (!orgId) return;
    setCategoriesLoading(true);
    categoriesAbortRef.current?.abort();
    categoriesAbortRef.current = new AbortController();
    const config = { signal: categoriesAbortRef.current.signal };
    try {
      const data = await safeFetch(() => api.getAllCategories(orgId, config), []);
      if (!config.signal.aborted) {
        setCategories(Array.isArray(data) ? data : []);
        setCategoriesLoading(false);
      }
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        setCategories([]);
        setCategoriesLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!shouldFetch) return;
    if (activeOrgId) {
      const timer = setTimeout(() => loadCategories(activeOrgId), 0);
      return () => clearTimeout(timer);
    }
  }, [activeOrgId, loadCategories, shouldFetch]);

  /* ─── Load topics ─── */

  const topicsAbortRef = useRef(null);
  const loadTopics = useCallback(async (orgId) => {
    if (!orgId) return;
    setTopicsLoading(true);
    topicsAbortRef.current?.abort();
    topicsAbortRef.current = new AbortController();
    const config = { signal: topicsAbortRef.current.signal };
    try {
      const data = await safeFetch(() => api.getAllTopics(orgId, topicsSearch, topicsPage, topicsSize, config), fallbackPaginated);
      if (!config.signal.aborted) {
        setTopics(normalizePaginated(data, topicsSize));
        setTopicsLoading(false);
      }
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        setTopics(fallbackPaginated);
        setTopicsLoading(false);
      }
    }
  }, [topicsSearch, topicsPage, topicsSize]);

  useEffect(() => {
    if (!shouldFetch) return;
    if (activeOrgId) {
      const timer = setTimeout(() => loadTopics(activeOrgId), 0);
      return () => clearTimeout(timer);
    }
  }, [activeOrgId, loadTopics, shouldFetch]);

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

  const handleUpdateTopicStatus = useCallback(async (topicId, status) => {
    try {
      await api.updateTopicStatus(topicId, status);
      if (activeOrgId) {
        await loadTopics(activeOrgId);
      }
      return true;
    } catch {
      return false;
    }
  }, [activeOrgId, loadTopics]);

  const handleUpdateCategoryStatus = useCallback(async (categoryId, status) => {
    try {
      await api.updateCategoryStatus(categoryId, status);
      if (activeOrgId) {
        await loadCategories(activeOrgId);
      }
      return true;
    } catch {
      return false;
    }
  }, [activeOrgId, loadCategories]);

  // Stable composite setters: reset the page when the keyword changes, without
  // changing identity across renders (otherwise effects depending on them would
  // re-run on every page change and snap the table back to the first page).
  const setPostsSearchAndResetPage = useCallback((kw) => {
    setPostsSearch(kw);
    setPostsPage(0);
  }, []);

  const setTopicsSearchAndResetPage = useCallback((kw) => {
    setTopicsSearch(kw);
    setTopicsPage(0);
  }, []);

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

  return useMemo(() => ({
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
    setPostsSearch: setPostsSearchAndResetPage,
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
    setTopicsSearch: setTopicsSearchAndResetPage,
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
    updateTopicStatus: handleUpdateTopicStatus,
    updateCategoryStatus: handleUpdateCategoryStatus,

    // Reload
    reloadStatistics: loadStatistics,
  }), [
    loading, statistics, topContributors, organizationEngagement, monthlyTimeline,
    contributorMonth, contributorYear, timelineYear,
    bannedPosts, bannedPage, yesterdayPosts, yesterdayPage, reports, reportsPage,
    allPosts, postsPage, postsSize, posts, postsSearch, statusFilter, organizationFilter,
    setPostsSearchAndResetPage, setTopicsSearchAndResetPage,
    updatePostStatus, handleDeletePost,
    categories, categoriesLoading, activeOrgId, loadCategories,
    topics, topicsSearch, topicsPage, topicsSize, topicsLoading, loadTopics,
    handleBanPost, handleUnbanPost, handleCreateCategory, handleUpdateCategory, handleDeleteCategory,
    handleCreateTopic, handleUpdateTopic, handleDeleteTopic, handleReviewReport,
    handleUpdatePostVisibility, handleUpdateTopicStatus, handleUpdateCategoryStatus, loadStatistics
  ]);
};

export default useAdminForumData;
