import { useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Stack, Box, Chip,
} from '@mui/material';
import PollOutlinedIcon from '@mui/icons-material/PollOutlined';
import { useTranslation } from 'react-i18next';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useAuth } from '../../hooks/useAuth';
import useSurveyPromptStore from '../../stores/surveyPromptStore';

/**
 * Popup listing OPEN surveys the user has not answered.
 * Auto-shows on entry (once per session), and can be re-opened anytime from the
 * survey icon in the header. State lives in {@link useSurveyPromptStore}.
 */
const SurveyPromptModal = () => {
  const { t } = useTranslation(['survey', 'common']);
  const navigate = useOrgNavigate();
  const { isAuthenticated } = useAuth();

  const pending = useSurveyPromptStore((s) => s.pending);
  const open = useSurveyPromptStore((s) => s.open);
  const fetchPending = useSurveyPromptStore((s) => s.fetchPending);
  const dismissAll = useSurveyPromptStore((s) => s.dismissAll);
  const markOpened = useSurveyPromptStore((s) => s.markOpened);
  const reset = useSurveyPromptStore((s) => s.reset);

  useEffect(() => {
    if (!isAuthenticated) {
      reset();
      return;
    }
    fetchPending();
  }, [isAuthenticated, fetchPending, reset]);

  const join = (id) => {
    markOpened(id);
    navigate(`/surveys/${id}`);
  };

  if (!open || pending.length === 0) return null;

  return (
    <Dialog open={open} onClose={dismissAll} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <PollOutlinedIcon color="primary" />
          <span>{t('survey:prompt_title')}</span>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('survey:prompt_subtitle')}
        </Typography>
        <Stack spacing={1.5}>
          {pending.map((s) => (
            <Box key={s.id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={700}>{s.title}</Typography>
              {s.description && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {s.description}
                </Typography>
              )}
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip size="small" label={`${s.questions?.length ?? 0} ${t('survey:questions_count')}`} />
                <Box sx={{ flex: 1 }} />
                <Button size="small" variant="contained" onClick={() => join(s.id)}>
                  {t('survey:prompt_join')}
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={dismissAll}>{t('survey:prompt_skip')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SurveyPromptModal;
