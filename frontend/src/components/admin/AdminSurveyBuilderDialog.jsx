import { useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next';
import { SURVEY_QUESTION_TYPES, isChoiceType } from '../../constants/surveyQuestionTypes';
import { surveyApi } from '../../utils/api';
import { useNotification } from '../../hooks/useNotification';
import { useOrganization } from '../../hooks/useOrganization';

let counter = 0;
const uid = (prefix) => `${prefix}_${Date.now()}_${counter++}`;

const emptyQuestion = () => ({
  localId: uid('local'),
  id: uid('q'),
  text: '',
  type: 'SHORT_TEXT',
  is_required: false,
  options: [],
});

const emptyOption = () => ({ id: uid('opt'), text: '' });

// Convert a datetime-local input value <-> ISO LocalDateTime string (no timezone)
const toInputValue = (iso) => (iso ? String(iso).slice(0, 16) : '');
const fromInputValue = (v) => (v ? `${v}:00` : null);

const AdminSurveyBuilderDialog = ({ open, onClose, survey, onSaved }) => {
  const { t } = useTranslation(['survey', 'common', 'admin']);
  const { showSuccess, showError } = useNotification();
  const { organization } = useOrganization();
  const isEdit = Boolean(survey?.id);
  const readOnly = isEdit && survey?.status && survey.status !== 'DRAFT';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(1440);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (survey) {
      setTitle(survey.title || '');
      setDescription(survey.description || '');
      setStartAt(toInputValue(survey.startAt));
      setDurationMinutes(survey.durationMinutes || 1440);
      setAllowMultiple(Boolean(survey.allowMultiple));
      setQuestions(
        (survey.questions || []).map((q) => ({
          localId: uid('local'),
          id: q.id || uid('q'),
          text: q.text || '',
          type: q.type || 'SHORT_TEXT',
          is_required: Boolean(q.is_required),
          options: (q.options || []).map((o) => ({ id: o.id || uid('opt'), text: o.text || '' })),
        })),
      );
    } else {
      setTitle('');
      setDescription('');
      setStartAt('');
      setDurationMinutes(1440);
      setAllowMultiple(false);
      setQuestions([emptyQuestion()]);
    }
  }, [open, survey]);

  const patchQuestion = (localId, patch) =>
    setQuestions((prev) => prev.map((q) => (q.localId === localId ? { ...q, ...patch } : q)));

  const moveQuestion = (index, dir) => {
    setQuestions((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const validate = () => {
    if (!title.trim()) return t('survey:err_title_required');
    if (!startAt) return t('survey:err_start_required');
    if (!durationMinutes || durationMinutes < 1) return t('survey:err_duration_required');
    if (questions.length === 0) return t('survey:err_min_one_question');
    for (const q of questions) {
      if (!q.text.trim()) return t('survey:err_question_text_required');
      if (isChoiceType(q.type) && q.options.filter((o) => o.text.trim()).length < 1) {
        return t('survey:err_option_required');
      }
    }
    return null;
  };

  const buildPayload = () => ({
    title: title.trim(),
    description: description.trim() || null,
    organizationId: survey?.organizationId ?? organization?.id,
    startAt: fromInputValue(startAt),
    durationMinutes: Number(durationMinutes),
    allowMultiple,
    questions: questions.map((q) => ({
      id: q.id,
      text: q.text.trim(),
      type: q.type,
      is_required: Boolean(q.is_required),
      options: isChoiceType(q.type)
        ? q.options.filter((o) => o.text.trim()).map((o) => ({ id: o.id, text: o.text.trim() }))
        : undefined,
    })),
  });

  const handleSave = async () => {
    const err = validate();
    if (err) {
      showError(err);
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        await surveyApi.updateSurvey(survey.id, payload);
        showSuccess(t('survey:updated_success'));
      } else {
        await surveyApi.createSurvey(payload);
        showSuccess(t('survey:created_success'));
      }
      onSaved?.();
      onClose?.();
    } catch (e) {
      showError(e?.response?.data?.message || t('common:error_occurred'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEdit ? t('survey:edit_survey') : t('survey:create_survey')}
      </DialogTitle>
      <DialogContent dividers>
        {readOnly && (
          <Alert severity="info" sx={{ mb: 2 }}>{t('survey:readonly_notice')}</Alert>
        )}
        <Stack spacing={2}>
          <TextField
            label={t('survey:field_title')} value={title} disabled={readOnly}
            onChange={(e) => setTitle(e.target.value)} fullWidth required
          />
          <TextField
            label={t('survey:field_description')} value={description} disabled={readOnly}
            onChange={(e) => setDescription(e.target.value)} fullWidth multiline minRows={2}
          />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label={t('survey:field_start_at')} type="datetime-local" value={startAt} disabled={readOnly}
                onChange={(e) => setStartAt(e.target.value)} fullWidth InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label={t('survey:field_duration')} type="number" value={durationMinutes} disabled={readOnly}
                onChange={(e) => setDurationMinutes(e.target.value)} fullWidth inputProps={{ min: 1 }}
              />
            </Grid>
          </Grid>
          <FormControlLabel
            control={<Checkbox checked={allowMultiple} disabled={readOnly}
              onChange={(e) => setAllowMultiple(e.target.checked)} />}
            label={t('survey:field_allow_multiple')}
          />

          <Divider textAlign="left">
            <Typography variant="subtitle2" fontWeight={700}>{t('survey:questions')}</Typography>
          </Divider>

          {questions.map((q, index) => (
            <Box key={q.localId} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mb: 1 }}>
                <IconButton size="small" disabled={readOnly || index === 0} onClick={() => moveQuestion(index, -1)}>
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" disabled={readOnly || index === questions.length - 1} onClick={() => moveQuestion(index, 1)}>
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" disabled={readOnly}
                  onClick={() => setQuestions((p) => p.filter((x) => x.localId !== q.localId))}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>

              <TextField
                label={`${t('survey:question')} ${index + 1}`} value={q.text} disabled={readOnly}
                onChange={(e) => patchQuestion(q.localId, { text: e.target.value })}
                fullWidth size="small" sx={{ mb: 1 }}
              />
              <Grid container spacing={1} alignItems="center">
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{t('survey:question_type')}</InputLabel>
                    <Select
                      label={t('survey:question_type')} value={q.type} disabled={readOnly}
                      onChange={(e) => patchQuestion(q.localId, { type: e.target.value })}
                    >
                      {SURVEY_QUESTION_TYPES.map((qt) => (
                        <MenuItem key={qt.value} value={qt.value}>{t(qt.labelKey)}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={<Checkbox checked={Boolean(q.is_required)} disabled={readOnly}
                      onChange={(e) => patchQuestion(q.localId, { is_required: e.target.checked })} />}
                    label={t('survey:required')}
                  />
                </Grid>
              </Grid>

              {isChoiceType(q.type) && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">{t('survey:options')}</Typography>
                  {(q.options || []).map((opt, optIdx) => (
                    <Box key={opt.id} sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <TextField
                        fullWidth size="small" value={opt.text} disabled={readOnly}
                        onChange={(e) => {
                          const next = [...q.options];
                          next[optIdx] = { ...next[optIdx], text: e.target.value };
                          patchQuestion(q.localId, { options: next });
                        }}
                      />
                      <IconButton size="small" disabled={readOnly}
                        onClick={() => patchQuestion(q.localId, { options: q.options.filter((_, i) => i !== optIdx) })}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  <Button size="small" startIcon={<AddIcon />} disabled={readOnly} sx={{ mt: 0.5 }}
                    onClick={() => patchQuestion(q.localId, { options: [...(q.options || []), emptyOption()] })}>
                    {t('survey:add_option')}
                  </Button>
                </Box>
              )}
            </Box>
          ))}

          {!readOnly && (
            <Button startIcon={<AddIcon />} onClick={() => setQuestions((p) => [...p, emptyQuestion()])}>
              {t('survey:add_question')}
            </Button>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common:cancel')}</Button>
        {!readOnly && (
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? t('common:saving') : t('common:save')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AdminSurveyBuilderDialog;
