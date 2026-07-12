import { useState } from 'react';
import { alpha } from '@mui/material';
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
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {tags.map((tag, index) => (
          <Chip
            key={tag}
            draggable
            label={`${index + 1}. ${tag}`}
            deleteIcon={<CloseIcon />}
            onDelete={() => onRemove(tag)}
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
              borderRadius: 1,
              maxWidth: '100%',
              fontWeight: 700,
              border: '1px solid',
              borderColor: overIndex === index ? theme.palette.primary.main : theme.palette.divider,
              bgcolor: overIndex === index
                ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.06)
                : 'background.paper',
              opacity: dragIndex === index ? 0.5 : 1,
              cursor: 'grab',
              '& .MuiChip-label': {
                maxWidth: 280,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              },
            })}
          />
        ))}
      </Box>
    </Stack>
  );
};

export default TagPriorityList;
