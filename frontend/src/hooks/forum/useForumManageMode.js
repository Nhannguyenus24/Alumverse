import { useState } from 'react';

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
      showWarning('Vui lòng nhập tên chủ đề chính.');
      return;
    }
    setManageTopics((prev) => [
      ...prev,
      { id: `topic-${Date.now()}`, title: trimmed.toUpperCase(), boards: [] },
    ]);
    setNewMainTopic('');
    showSuccess('Đã thêm chủ đề chính.');
  };

  const handleAddSubTopic = (topicId) => {
    const value = newSubTopics[topicId]?.trim() ?? '';
    if (!value) {
      showWarning('Vui lòng nhập tên chủ đề con.');
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
    showSuccess('Đã thêm chủ đề con.');
  };

  const handleDeleteTopic = (topicId) => {
    setManageTopics((prev) => prev.filter((t) => t.id !== topicId));
    showInfo('Đã xóa chủ đề.');
  };

  const handleDeleteBoard = (topicId, boardId) => {
    setManageTopics((prev) =>
      prev.map((t) =>
        t.id === topicId ? { ...t, boards: t.boards.filter((b) => b.id !== boardId) } : t
      )
    );
    showInfo('Đã xóa chủ đề con.');
  };

  const handleSaveTopics = () => {
    handleCloseManageMode();
    showSuccess('Đã lưu thay đổi chủ đề.');
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
