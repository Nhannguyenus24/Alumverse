import { useState } from 'react';
import { Box, IconButton, Stack, Typography, alpha } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';

/**
 * Priority-ordered skill tag list with native HTML5 drag-and-drop reordering.
 * The mentor drags a row by its handle (≡) to rank skills by importance —
 * index 0 is sent to the backend as the highest-priority tag.
 */
const TagPriorityList = ({ tags, onReorder, onRemove }) => {
  const { t } = useTranslation('mentorship');
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const handleDrop = (targetIndex) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const next = [...tags];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    onReorder(next);
    setDragIndex(null);
    setOverIndex(null);
  };

  if (tags.length === 0) return null;

  return (
    <Stack spacing={1}>
      <Typography variant="caption" color="text.secondary">
        {t('signup_tab_tags_priority_hint')}
      </Typography>
      {tags.map((tag, index) => (
        <Box
          key={tag}
          draggable
          onDragStart={() => setDragIndex(index)}
          onDragOver={(e) => {
            e.preventDefault();
            if (overIndex !== index) setOverIndex(index);
          }}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(index);
          }}
          onDragEnd={() => {
            setDragIndex(null);
            setOverIndex(null);
          }}
          sx={(theme) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 1,
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: overIndex === index ? theme.palette.primary.main : theme.palette.divider,
            bgcolor: overIndex === index
              ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.06)
              : 'transparent',
            opacity: dragIndex === index ? 0.5 : 1,
            cursor: 'grab',
          })}
        >
          <IconButton size="small" onClick={() => onRemove(tag)} aria-label={t('signup_tab_remove_tag')}>
            <CloseIcon fontSize="small" />
          </IconButton>
          <Typography
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            sx={{ width: 20, textAlign: 'center', flexShrink: 0 }}
          >
            {index + 1}
          </Typography>
          <Typography sx={{ flexGrow: 1, fontWeight: 600 }} noWrap>
            {tag}
          </Typography>
          <DragIndicatorIcon fontSize="small" sx={{ color: 'text.disabled', flexShrink: 0 }} />
        </Box>
      ))}
    </Stack>
  );
};

export default TagPriorityList;
