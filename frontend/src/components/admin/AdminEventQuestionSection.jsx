import { useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next';
import {
  useEventQuestions,
  mapQuestionToApi,
} from '../../hooks/events/useEventQuestions';
import { eventApi } from '../../utils/api';

const getQuestionTypes = (t) => [
  { value: 'shortText', label: t('event:question_type_short_text') },
  { value: 'singleChoice', label: t('event:question_type_single_choice') },
  { value: 'multiChoice', label: t('event:question_type_multi_choice') },
];

const emptyDraft = () => ({
  localId: Date.now(),
  type: 'shortText',
  label: '',
  options: [''],
  required: false,
  isNew: true,
});

const AdminEventQuestionSection = ({ eventId }) => {
  const { t } = useTranslation(['event', 'common']);
  const { data: savedQuestions = [], refetch, isPending } = useEventQuestions(eventId, Boolean(eventId));
  const [drafts, setDrafts] = useState([]);
  const [saving, setSaving] = useState(false);
  const QUESTION_TYPES = getQuestionTypes(t);

  useEffect(() => {
    if (!eventId) {
      setDrafts([]);
      return;
    }
    setDrafts(savedQuestions.map((q) => ({
      ...q,
      localId: q.id,
      options: q.options?.length ? q.options : [''],
      isNew: false,
    })));
  }, [eventId, savedQuestions]);

  const updateDraft = (localId, patch) => {
    setDrafts((prev) => prev.map((d) => (d.localId === localId ? { ...d, ...patch } : d)));
  };

  const moveDraft = (index, direction) => {
    const next = [...drafts];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setDrafts(next);
  };

  const handleSaveAll = async () => {
    if (!eventId) return;
    setSaving(true);
    try {
      for (let i = 0; i < drafts.length; i++) {
        const d = drafts[i];
        const payload = mapQuestionToApi(d, i);
        if (d.isNew) {
          await eventApi.createEventQuestion(eventId, payload);
        } else {
          await eventApi.updateEventQuestion(eventId, d.id, payload);
        }
      }
      const savedIds = new Set(drafts.filter((d) => !d.isNew).map((d) => d.id));
      for (const q of savedQuestions) {
        if (!savedIds.has(q.id)) {
          await eventApi.deleteEventQuestion(eventId, q.id);
        }
      }
      await refetch();
    } finally {
      setSaving(false);
    }
  };

  if (!eventId) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('event:save_event_before_adding_questions')}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" fontWeight={700}>{t('event:registration_questions')}</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={() => setDrafts((p) => [...p, emptyDraft()])}>
          {t('event:add_question')}
        </Button>
      </Box>

      {isPending && <Typography variant="body2" color="text.secondary">{t('common:loading')}</Typography>}

      {drafts.map((draft, index) => (
        <Box key={draft.localId} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <IconButton size="small" onClick={() => moveDraft(index, -1)} disabled={index === 0}>
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => moveDraft(index, 1)} disabled={index === drafts.length - 1}>
              <ArrowDownwardIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => setDrafts((p) => p.filter((d) => d.localId !== draft.localId))}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>

          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel>{t('event:question_type')}</InputLabel>
            <Select
              label={t('event:question_type')}
              value={draft.type}
              onChange={(e) => updateDraft(draft.localId, { type: e.target.value })}
            >
              {QUESTION_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            size="small"
            label={t('event:question_content')}
            value={draft.label}
            onChange={(e) => updateDraft(draft.localId, { label: e.target.value })}
            sx={{ mb: 1 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(draft.required)}
                onChange={(e) => updateDraft(draft.localId, { required: e.target.checked })}
              />
            }
            label={t('common:required')}
          />

          {(draft.type === 'singleChoice' || draft.type === 'multiChoice') && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">{t('event:options')}</Typography>
              {(draft.options || []).map((opt, optIdx) => (
                <Box key={optIdx} sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={opt}
                    onChange={(e) => {
                      const next = [...(draft.options || [])];
                      next[optIdx] = e.target.value;
                      updateDraft(draft.localId, { options: next });
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => updateDraft(draft.localId, {
                      options: (draft.options || []).filter((_, i) => i !== optIdx),
                    })}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              <Button
                size="small"
                sx={{ mt: 0.5 }}
                onClick={() => updateDraft(draft.localId, { options: [...(draft.options || []), ''] })}
              >
                {t('event:add_option')}
              </Button>
            </Box>
          )}
        </Box>
      ))}

      {drafts.length > 0 && (
        <>
          <Divider />
          <Button variant="contained" onClick={handleSaveAll} disabled={saving}>
            {saving ? t('common:saving') : t('event:save_questions')}
          </Button>
        </>
      )}
    </Box>
  );
};

export default AdminEventQuestionSection;
