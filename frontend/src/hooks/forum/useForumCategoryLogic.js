import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useOrgNavigate } from '../useOrgNavigate';
import { useForumCategories } from './useForumCategories';
import { useForumTopics } from './useForumTopics';
import { useDebounce } from '../useDebounce';
import { useNotification } from '../useNotification';

export const FORUM_TOPIC_SORT_OPTIONS = {
  NEWEST: 'newest',
  MOST_VIEWED: 'most_viewed',
};

export const FORUM_TOPICS_PAGE_SIZE = 20;

export const useForumCategoryLogic = (organizationId) => {
  const { t } = useTranslation('forum');
  const { categoryId: categoryIdParam } = useParams();
  const navigate = useOrgNavigate();
  const location = useLocation();
  const { showError } = useNotification();
  const hasShownTopicsErrorRef = useRef(false);
  const invalidCategoryShownRef = useRef(false);

  const { categories, isPending: categoriesPending } = useForumCategories(organizationId);

  const categoryId = useMemo(() => {
    const n = Number(categoryIdParam);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [categoryIdParam]);

  // Search topics by title (debounced), sort control (newest vs. most viewed), and pagination.
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState(FORUM_TOPIC_SORT_OPTIONS.NEWEST);
  const [page, setPage] = useState(0);
  const debouncedKeyword = useDebounce(searchKeyword.trim(), 400);

  // Render-phase resets (React's recommended alternative to setState inside an effect).
  // Navigating to a different category clears the search box and sort order.
  const [trackedCategoryId, setTrackedCategoryId] = useState(categoryId);
  if (categoryId !== trackedCategoryId) {
    setTrackedCategoryId(categoryId);
    setSearchKeyword('');
    setSortBy(FORUM_TOPIC_SORT_OPTIONS.NEWEST);
  }

  // Any change to the effective result set (category, keyword, or sort) returns to page 1.
  const resultKey = `${categoryId}|${debouncedKeyword}|${sortBy}`;
  const [trackedResultKey, setTrackedResultKey] = useState(resultKey);
  if (resultKey !== trackedResultKey) {
    setTrackedResultKey(resultKey);
    setPage(0);
  }

  const {
    topics,
    pageInfo,
    isPending: topicsPending,
    isError,
  } = useForumTopics(
    categoryId,
    debouncedKeyword,
    sortBy,
    page,
    FORUM_TOPICS_PAGE_SIZE
  );

  useEffect(() => {
    if (categoryId != null) {
      invalidCategoryShownRef.current = false;
      return;
    }
    if (!invalidCategoryShownRef.current) {
      showError(t('forum:invalid_category'));
      invalidCategoryShownRef.current = true;
    }
  }, [categoryId, showError]);

  useEffect(() => {
    if (categoryId == null) return;
    if (isError) {
      if (!hasShownTopicsErrorRef.current) {
        showError(t('forum:load_topics_error'));
        hasShownTopicsErrorRef.current = true;
      }
      return;
    }
    hasShownTopicsErrorRef.current = false;
  }, [categoryId, isError, showError]);

  const parentCategories = useMemo(() => {
    const list = (categories ?? []).filter((c) => c.parentId == null);
    list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
    return list;
  }, [categories]);

  const filters = useMemo(() => {
    if (categoriesPending && !categories?.length) {
      return [{ id: 'all', label: t('forum:filter_all') }];
    }
    return [{ id: 'all', label: t('filter_all') }, ...parentCategories.map((p) => ({ id: `parent-${p.id}`, label: p.name }))];
  }, [categories, categoriesPending, parentCategories, t]);

  const activeCategory = useMemo(
    () => (categoryId != null ? categories?.find((c) => c.id === categoryId) : null),
    [categories, categoryId]
  );

  const parentCategory = useMemo(() => {
    if (!activeCategory?.parentId) return null;
    return categories?.find((c) => c.id === activeCategory.parentId) ?? null;
  }, [activeCategory, categories]);

  const selectedSidebarId = useMemo(() => {
    const fromNav = location.state?.selectedFilterId;
    if (fromNav === 'all' || (typeof fromNav === 'string' && fromNav.startsWith('parent-'))) {
      return fromNav;
    }
    if (!activeCategory) return 'all';
    if (activeCategory.parentId != null) return `parent-${activeCategory.parentId}`;
    return `parent-${activeCategory.id}`;
  }, [activeCategory, location.state?.selectedFilterId]);

  const handleFilterChange = useCallback(
    (id) => {
      if (id === 'all') {
        navigate('/forum');
        return;
      }
      if (typeof id === 'string' && id.startsWith('parent-')) {
        navigate('/forum', { state: { selectedFilterId: id } });
      }
    },
    [navigate]
  );

  const breadcrumbItems = useMemo(() => {
    const items = [];
    if (parentCategory) {
      items.push({
        label: parentCategory.name,
        path: '/forum',
        state: { selectedFilterId: `parent-${parentCategory.id}` },
      });
    }
    items.push({ label: activeCategory?.name ?? t('forum:category') });
    return items;
  }, [activeCategory, parentCategory]);

  const pageTitle = activeCategory?.name
    ? t('forum:forum_topic_page_title', { name: activeCategory.name })
    : t('forum:forum_category_page_title');

  return {
    categoryId,
    topics,
    topicsPending,
    isError,
    filters,
    activeCategory,
    selectedSidebarId,
    breadcrumbItems,
    pageTitle,
    handleFilterChange,
    navigate,
    searchKeyword,
    setSearchKeyword,
    debouncedKeyword,
    sortBy,
    setSortBy,
    page,
    setPage,
    pageInfo,
  };
};
