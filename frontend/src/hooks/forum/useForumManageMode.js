import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useManageForumCategories } from './useManageForumCategories';

const sectionsToManageTopics = (sections) =>
  sections.map((s) => ({
    id: s.id,
    title: s.title,
    boards: s.boards.map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description ?? '',
    })),
  }));

export const useForumManageMode = ({ organizationId, visibleSections, showSuccess, showWarning, showInfo, showError }) => {
  const { t } = useTranslation('forum');
  const manageCategoriesMutation = useManageForumCategories(organizationId);
  const [isManageMode, setIsManageMode] = useState(false);
  const [manageTopics, setManageTopics] = useState(() => sectionsToManageTopics([]));
  const [newMainTopic, setNewMainTopic] = useState('');
  const [newMainTopicDesc, setNewMainTopicDesc] = useState('');
  const [newSubTopics, setNewSubTopics] = useState({});
  const [newSubTopicDescs, setNewSubTopicDescs] = useState({});

  const handleOpenManageMode = () => {
    setManageTopics(sectionsToManageTopics(visibleSections));
    setNewMainTopic('');
    setNewMainTopicDesc('');
    setNewSubTopics({});
    setNewSubTopicDescs({});
    setIsManageMode(true);
  };

  const handleCloseManageMode = () => setIsManageMode(false);

  const handleAddMainTopic = () => {
    const trimmed = newMainTopic.trim();
    if (!trimmed) {
      showWarning(t('forum:manage_topic_name_required'));
      return;
    }
    setManageTopics((prev) => [
      ...prev,
      { id: `topic-${Date.now()}`, title: trimmed.toUpperCase(), description: newMainTopicDesc.trim(), boards: [] },
    ]);
    setNewMainTopic('');
    setNewMainTopicDesc('');
    showSuccess(t('forum:manage_topic_added'));
  };

  const handleAddSubTopic = (topicId) => {
    const value = newSubTopics[topicId]?.trim() ?? '';
    const descValue = newSubTopicDescs[topicId]?.trim() ?? '';
    if (!value) {
      showWarning(t('forum:manage_subtopic_name_required'));
      return;
    }
    setManageTopics((prev) =>
      prev.map((t) =>
        t.id === topicId
          ? {
              ...t,
              boards: [...t.boards, { id: `board-${Date.now()}`, name: value, description: descValue }],
            }
          : t
      )
    );
    setNewSubTopics((prev) => ({ ...prev, [topicId]: '' }));
    setNewSubTopicDescs((prev) => ({ ...prev, [topicId]: '' }));
    showSuccess(t('forum:manage_subtopic_added'));
  };

  const handleDeleteTopic = (topicId) => {
    setManageTopics((prev) => prev.filter((t) => t.id !== topicId));
    showInfo(t('forum:manage_topic_deleted'));
  };

  const handleDeleteBoard = (topicId, boardId) => {
    setManageTopics((prev) =>
      prev.map((t) =>
        t.id === topicId ? { ...t, boards: t.boards.filter((b) => b.id !== boardId) } : t
      )
    );
    showInfo(t('forum:manage_subtopic_deleted'));
  };

  const handleSaveTopics = async () => {
    try {
      await manageCategoriesMutation.mutateAsync({
        originalSections: sectionsToManageTopics(visibleSections),
        currentSections: manageTopics,
      });
      handleCloseManageMode();
      showSuccess(t('forum:manage_topic_saved'));
    } catch (error) {
      showError(error?.response?.data?.message ?? error.message ?? 'Lỗi lưu thay đổi');
    }
  };

  const isSaving = manageCategoriesMutation.isPending;

  return {
    isManageMode,
    manageTopics,
    newMainTopic,
    newMainTopicDesc,
    newSubTopics,
    newSubTopicDescs,
    setNewMainTopic,
    setNewSubTopics,
    setNewMainTopicDesc,
    setNewSubTopicDescs,
    handleOpenManageMode,
    handleCloseManageMode,
    handleAddMainTopic,
    handleAddSubTopic,
    handleDeleteTopic,
    handleDeleteBoard,
    handleSaveTopics,
    isSaving,
  };
};
