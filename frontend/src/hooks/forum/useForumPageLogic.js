import { useMemo, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router';
import { useOrgNavigate } from '../useOrgNavigate';
import { useForumCategories } from './useForumCategories';

export const useForumPageLogic = (organizationId) => {
  const location = useLocation();
  const navigate = useOrgNavigate();

  const selectedFilterId = useMemo(() => {
    const sid = location.state?.selectedFilterId;
    if (sid === 'all' || (typeof sid === 'string' && sid.startsWith('parent-'))) {
      return sid;
    }
    return 'all';
  }, [location.state?.selectedFilterId]);

  const { categories, isPending } = useForumCategories(organizationId);

  useEffect(() => {
    const sid = location.state?.selectedFilterId;
    if (typeof sid === 'string' && sid.startsWith('category-')) {
      const cid = parseInt(sid.replace('category-', ''), 10);
      if (!Number.isNaN(cid) && cid > 0) {
        navigate(`/forum/category/${cid}`, {
          replace: true,
          state: { ...location.state, selectedFilterId: undefined },
        });
      }
    }
  }, [location.state, navigate]);

  const parentCategories = useMemo(() => {
    const list = (categories ?? []).filter((c) => c.parentId == null);
    list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
    return list;
  }, [categories]);

  const childrenByParentId = useMemo(() => {
    const map = new Map();
    for (const c of categories ?? []) {
      if (c.parentId != null) {
        const arr = map.get(c.parentId) ?? [];
        arr.push(c);
        map.set(c.parentId, arr);
      }
    }
    for (const [, arr] of map) {
      arr.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
    }
    return map;
  }, [categories]);

  const filters = useMemo(() => {
    if (isPending && !categories?.length) {
      return [{ id: 'all', label: 'Tất cả' }];
    }
    return [{ id: 'all', label: 'Tất cả' }, ...parentCategories.map((p) => ({ id: `parent-${p.id}`, label: p.name }))];
  }, [categories, isPending, parentCategories]);

  const sections = useMemo(() => {
    return parentCategories.map((parent) => ({
      id: `section-${parent.id}`,
      title: (parent.name || '').toUpperCase(),
      parentId: parent.id,
      boards: (childrenByParentId.get(parent.id) ?? []).map((sub) => ({
        id: `cat-${sub.id}`,
        categoryId: sub.id,
        name: sub.name,
        description: sub.description ?? '',
        topicCount: sub.topicCount ?? 0,
        participantCount: sub.participantCount ?? 0,
        lastPost: null,
      })),
    }));
  }, [parentCategories, childrenByParentId]);

  const visibleSections = useMemo(() => {
    if (selectedFilterId === 'all') return sections;
    if (selectedFilterId.startsWith('parent-')) {
      const pid = parseInt(selectedFilterId.replace('parent-', ''), 10);
      if (Number.isNaN(pid)) return sections;
      return sections.filter((s) => s.parentId === pid);
    }
    return sections;
  }, [selectedFilterId, sections]);

  const handleFilterChange = useCallback(
    (id) => {
      navigate('/forum', { replace: true, state: { ...(location.state ?? {}), selectedFilterId: id } });
    },
    [navigate, location.state]
  );

  const handleBoardClick = useCallback(
    (board) => {
      const cid = board?.categoryId;
      if (cid == null) return;
      navigate(`/forum/category/${cid}`, {
        state: {
          selectedFilterId:
            board.parentSectionId != null ? `parent-${board.parentSectionId}` : selectedFilterId,
        },
      });
    },
    [navigate, selectedFilterId]
  );

  const boardsForSection = useCallback(
    (section) =>
      section.boards.map((b) => ({
        ...b,
        parentSectionId: section.parentId,
      })),
    []
  );

  return {
    filters,
    selectedFilterId,
    visibleSections,
    handleFilterChange,
    handleBoardClick,
    boardsForSection,
  };
};
