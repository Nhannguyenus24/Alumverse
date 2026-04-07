import { useCallback, useEffect, useState } from 'react';
import * as api from '../../api/adminForumApi';

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

/* ─── Hook ─── */

const useAdminForumData = (activeOrgId) => {
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
    setBannedPosts(data);
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
    setYesterdayPosts(data);
  }, [yesterdayPage]);

  useEffect(() => {
    loadYesterdayPosts();
  }, [loadYesterdayPosts]);

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
    setTopics(data);
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
      await loadBannedPosts();
      await loadStatistics();
      return true;
    } catch {
      return false;
    }
  }, [loadBannedPosts, loadStatistics]);

  const handleUnbanPost = useCallback(async (postId) => {
    try {
      await api.unbanPost(postId);
      await loadBannedPosts();
      await loadStatistics();
      return true;
    } catch {
      return false;
    }
  }, [loadBannedPosts, loadStatistics]);

  const handleDeletePost = useCallback(async (postId) => {
    try {
      await api.deletePost(postId);
      await loadStatistics();
      return true;
    } catch {
      return false;
    }
  }, [loadStatistics]);

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

    // Reload
    reloadStatistics: loadStatistics,
  };
};

export default useAdminForumData;
