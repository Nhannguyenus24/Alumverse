import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../utils/axios';

export const useManageForumCategories = (organizationId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ originalSections, currentSections }) => {
      // 1. Identify deleted categories (original sections or boards missing in current)
      const currentParentIds = new Set(currentSections.map(s => s.id));
      const currentBoardIds = new Set(currentSections.flatMap(s => s.boards.map(b => b.id)));
      
      const toDelete = [];
      
      originalSections.forEach(origSection => {
        if (!currentParentIds.has(origSection.id)) {
          // Entire parent section deleted
          const catId = parseInt(origSection.id.replace('section-', ''), 10);
          if (!isNaN(catId)) toDelete.push(catId);
          // (Backend cascades deletes to subcategories, so we don't need to explicitly delete its boards)
        } else {
          // Parent still exists, check its boards
          origSection.boards.forEach(origBoard => {
            if (!currentBoardIds.has(origBoard.id)) {
              const catId = parseInt(origBoard.id.replace('cat-', ''), 10);
              if (!isNaN(catId)) toDelete.push(catId);
            }
          });
        }
      });

      // Execute deletions first
      for (const catId of toDelete) {
        await apiClient.delete(`/admin/forum/admin/categories/${catId}`);
      }

      // 2. Process current sections (Create / Update)
      for (const section of currentSections) {
        let parentCategoryId = null;

        if (section.id.startsWith('topic-')) {
          // Create new parent category
          const params = new URLSearchParams();
          params.append('organizationId', organizationId);
          params.append('name', section.title);
          if (section.description) params.append('description', section.description);
          
          const res = await apiClient.post(`/admin/forum/admin/categories?${params.toString()}`);
          parentCategoryId = res.data?.data?.id;
        } else if (section.id.startsWith('section-')) {
          parentCategoryId = parseInt(section.id.replace('section-', ''), 10);
          
          // Check for update (if needed in the future, UI doesn't support edit name right now)
          const origSection = originalSections.find(s => s.id === section.id);
          if (origSection && (origSection.title !== section.title || origSection.description !== section.description)) {
            const params = new URLSearchParams();
            params.append('name', section.title);
            if (section.description) params.append('description', section.description);
            await apiClient.put(`/admin/forum/admin/categories/${parentCategoryId}?${params.toString()}`);
          }
        }

        if (!parentCategoryId) continue;

        // Process boards of this section
        for (const board of section.boards) {
          if (board.id.startsWith('board-')) {
            // Create new sub category
            const params = new URLSearchParams();
            params.append('organizationId', organizationId);
            params.append('name', board.name);
            params.append('parentId', parentCategoryId);
            if (board.description) params.append('description', board.description);
            
            await apiClient.post(`/admin/forum/admin/categories?${params.toString()}`);
          } else if (board.id.startsWith('cat-')) {
            const catId = parseInt(board.id.replace('cat-', ''), 10);
            
            // Check for update
            const origBoard = originalSections.flatMap(s => s.boards).find(b => b.id === board.id);
            if (origBoard && (origBoard.name !== board.name || origBoard.description !== board.description)) {
              const params = new URLSearchParams();
              params.append('name', board.name);
              if (board.description) params.append('description', board.description);
              await apiClient.put(`/admin/forum/admin/categories/${catId}?${params.toString()}`);
            }
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['forumCategories', organizationId]);
    },
  });
};
