import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router';
import { useOrgNavigate } from '../useOrgNavigate';
import { useForumCategories } from './useForumCategories';
import { useForumTopics } from './useForumTopics';
import { useNotification } from '../useNotification';

export const useForumCategoryLogic = (organizationId) => {
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

  const { topics, isPending: topicsPending, isError } = useForumTopics(categoryId, '', 0, 50);

  useEffect(() => {
    if (categoryId != null) {
      invalidCategoryShownRef.current = false;
      return;
    }
    if (!invalidCategoryShownRef.current) {
      showError('Danh mục không hợp lệ.');
      invalidCategoryShownRef.current = true;
    }
  }, [categoryId, showError]);

  useEffect(() => {
    if (categoryId == null) return;
    if (isError) {
      if (!hasShownTopicsErrorRef.current) {
        showError('Không thể tải danh sách chủ đề.');
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
      return [{ id: 'all', label: 'Tất cả' }];
    }
    return [{ id: 'all', label: 'Tất cả' }, ...parentCategories.map((p) => ({ id: `parent-${p.id}`, label: p.name }))];
  }, [categories, categoriesPending, parentCategories]);

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
    items.push({ label: activeCategory?.name ?? 'Danh mục' });
    return items;
  }, [activeCategory, parentCategory]);

  const pageTitle = activeCategory?.name ? `${activeCategory.name} — Diễn đàn` : 'Diễn đàn — Danh mục';

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
  };
};
