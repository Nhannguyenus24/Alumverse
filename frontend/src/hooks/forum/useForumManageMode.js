import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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

export const useForumManageMode = ({ visibleSections, showSuccess, showWarning, showInfo }) => {
  const { t } = useTranslation('forum');
  const [isManageMode, setIsManageMode] = useState(false);
  const [manageTopics, setManageTopics] = useState(() => sectionsToManageTopics([]));
  const [newMainTopic, setNewMainTopic] = useState('');
  const [newSubTopics, setNewSubTopics] = useState({});

  const handleOpenManageMode = () => {
    setManageTopics(sectionsToManageTopics(visibleSections));
    setNewMainTopic('');
    setNewSubTopics({});
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
      { id: `topic-${Date.now()}`, title: trimmed.toUpperCase(), boards: [] },
    ]);
    setNewMainTopic('');
    showSuccess(t('forum:manage_topic_added'));
  };

  const handleAddSubTopic = (topicId) => {
    const value = newSubTopics[topicId]?.trim() ?? '';
    if (!value) {
      showWarning(t('forum:manage_subtopic_name_required'));
      return;
    }
    setManageTopics((prev) =>
      prev.map((t) =>
        t.id === topicId
          ? {
              ...t,
              boards: [...t.boards, { id: `board-${Date.now()}`, name: value, description: '' }],
            }
          : t
      )
    );
    setNewSubTopics((prev) => ({ ...prev, [topicId]: '' }));
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

  const handleSaveTopics = () => {
    handleCloseManageMode();
    showSuccess(t('forum:manage_topic_saved'));
  };

  return {
    isManageMode,
    manageTopics,
    newMainTopic,
    newSubTopics,
    setNewMainTopic,
    setNewSubTopics,
    handleOpenManageMode,
    handleCloseManageMode,
    handleAddMainTopic,
    handleAddSubTopic,
    handleDeleteTopic,
    handleDeleteBoard,
    handleSaveTopics,
  };
};
