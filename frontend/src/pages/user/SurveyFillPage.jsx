import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Box, Container, Paper, Typography, TextField, RadioGroup, FormControlLabel, Radio, Checkbox,
  FormGroup, Button, Stack, Divider, CircularProgress, Rating, Alert, Chip,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { surveyApi } from '../../utils/api';
import { useNotification } from '../../hooks/useNotification';
import { isChoiceType } from '../../constants/surveyQuestionTypes';
import useSurveyPromptStore from '../../stores/surveyPromptStore';
import { normalizeRichTextHtml } from '../../utils/stringUtils';

const SurveyFillPage = ({ mode }) => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(['survey', 'common']);
  const { showSuccess, showError } = useNotification();

  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewMode, setReviewMode] = useState(mode === 'review');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await surveyApi.getSurvey(surveyId);
      setSurvey(s);
      const shouldReview = mode === 'review' || s.hasSubmitted;
      setReviewMode(shouldReview);
      if (shouldReview) {
        try {
          const sub = await surveyApi.getMySubmission(surveyId);
          setAnswers(sub?.answers || {});
        } catch { /* no submission yet */ }
      }
    } catch (e) {
      showError(e?.response?.data?.message || t('common:error_occurred'));
    } finally {
      setLoading(false);
    }
  }, [surveyId, mode, showError, t]);

  useEffect(() => { load(); }, [load]);

  const setAnswer = (qid, value) => setAnswers((prev) => ({ ...prev, [qid]: value }));

  const toggleMulti = (qid, optId, checked) => {
    setAnswers((prev) => {
      const cur = Array.isArray(prev[qid]) ? prev[qid] : [];
      return { ...prev, [qid]: checked ? [...cur, optId] : cur.filter((x) => x !== optId) };
    });
  };

  const validate = () => {
    for (const q of survey?.questions || []) {
      if (q.is_required) {
        const v = answers[q.id];
        const missing = v == null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && v.length === 0);
        if (missing) return t('survey:err_answer_required', { q: q.text });
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { showError(err); return; }
    setSubmitting(true);
    try {
      await surveyApi.submitSurvey(surveyId, answers);
      showSuccess(t('survey:submit_success'));
      setReviewMode(true);
      // Refresh the floating survey badge so the just-answered survey drops off.
      useSurveyPromptStore.getState().fetchPending();
    } catch (e) {
      showError(e?.response?.data?.message || t('common:error_occurred'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderInput = (q) => {
    const value = answers[q.id];
    if (reviewMode) {
      let text;
      if (Array.isArray(value)) {
        text = value.map((id) => q.options?.find((o) => o.id === id)?.text || id).join(', ');
      } else if (isChoiceType(q.type)) {
        text = q.options?.find((o) => o.id === value)?.text || value || '—';
      } else {
        text = value ?? '—';
      }
      return <Typography variant="body2" color="text.secondary">{String(text || '—')}</Typography>;
    }

    switch (q.type) {
      case 'SINGLE_CHOICE':
        return (
          <RadioGroup value={value || ''} onChange={(e) => setAnswer(q.id, e.target.value)}>
            {(q.options || []).map((o) => (
              <FormControlLabel key={o.id} value={o.id} control={<Radio />} label={o.text} />
            ))}
          </RadioGroup>
        );
      case 'MULTI_CHOICE':
        return (
          <FormGroup>
            {(q.options || []).map((o) => (
              <FormControlLabel key={o.id} control={
                <Checkbox
                  checked={Array.isArray(value) && value.includes(o.id)}
                  onChange={(e) => toggleMulti(q.id, o.id, e.target.checked)}
                />
              } label={o.text} />
            ))}
          </FormGroup>
        );
      case 'DATE':
        return <TextField type="date" value={value || ''} InputLabelProps={{ shrink: true }}
          fullWidth onChange={(e) => setAnswer(q.id, e.target.value)} />;
      case 'NUMBER':
        return <TextField type="number" value={value ?? ''} fullWidth
          onChange={(e) => setAnswer(q.id, e.target.value)} />;
      case 'RATING':
        return <Rating value={Number(value) || 0}
          onChange={(e, v) => setAnswer(q.id, v)} />;
      default:
        return <TextField value={value || ''} fullWidth multiline
          onChange={(e) => setAnswer(q.id, e.target.value)} />;
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  }
  if (!survey) return null;

  const canFill = !reviewMode && survey.effectiveStatus === 'OPEN';

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Paper sx={{ p: { xs: 2.5, sm: 4, md: 5 }, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography
            variant="h2"
            color="primary.main"
            fontWeight={800}
            sx={{ flex: 1 }}
          >
            {survey.title}
          </Typography>
          {reviewMode && <Chip size="small" color="success" label={t('survey:submitted_chip')} />}
        </Stack>
        {survey.description && (
          <Box
            sx={{
              mt: 1.5,
              color: 'text.secondary',
              fontSize: '0.95rem',
              lineHeight: 1.65,
              whiteSpace: 'pre-line',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              '& p': {
                m: 0,
                textAlign: 'justify',
                minHeight: '1.45em',
                '&:not(:last-child)': { mb: 1.25 },
              },
              '& p.ql-empty-line, & p:has(> br:only-child)': {
                display: 'block',
                minHeight: '1.45em',
                lineHeight: '1.45em',
                my: 0,
              },
              '& ul, & ol': { my: 1, pl: 3 },
              '& li': { mb: 0.5 },
              '& .ql-align-left': { textAlign: 'left !important' },
              '& [style*="text-align: left" i]': { textAlign: 'left !important' },
              '& .ql-align-center': { textAlign: 'center !important' },
              '& [style*="text-align: center" i]': { textAlign: 'center !important' },
              '& .ql-align-right': { textAlign: 'right !important' },
              '& [style*="text-align: right" i]': { textAlign: 'right !important' },
              '& .ql-align-justify': { textAlign: 'justify !important' },
              '& [style*="text-align: justify" i]': { textAlign: 'justify !important' },
            }}
            dangerouslySetInnerHTML={{ __html: normalizeRichTextHtml(survey.description) }}
          />
        )}

        {reviewMode && (
          <Alert severity="info" sx={{ mt: 2 }}>{t('survey:review_notice')}</Alert>
        )}
        {!reviewMode && survey.effectiveStatus !== 'OPEN' && (
          <Alert severity="warning" sx={{ mt: 2 }}>{t('survey:not_open_notice')}</Alert>
        )}

        <Divider sx={{ my: 2 }} />

        <Stack spacing={3}>
          {(survey.questions || []).map((q, idx) => (
            <Box key={q.id}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                {idx + 1}. {q.text}{q.is_required && <span style={{ color: '#d32f2f' }}> *</span>}
              </Typography>
              {renderInput(q)}
            </Box>
          ))}
        </Stack>

        <Divider sx={{ my: 3 }} />
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={() => navigate(-1)}>{t('common:back')}</Button>
          {canFill && (
            <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
              {submitting ? t('common:saving') : t('survey:submit')}
            </Button>
          )}
        </Stack>
      </Paper>
    </Container>
  );
};

export default SurveyFillPage;
