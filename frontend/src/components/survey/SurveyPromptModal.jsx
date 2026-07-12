import { useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useAuth } from '../../hooks/useAuth';
import { surveyApi } from '../../utils/api';

const DISMISS_KEY = 'dismissed_surveys';

const getDismissed = () => {
  try { return new Set(JSON.parse(sessionStorage.getItem(DISMISS_KEY) || '[]')); }
  catch { return new Set(); }
};
const addDismissed = (id) => {
  const set = getDismissed();
  set.add(id);
  sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...set]));
};

/**
 * Popup shown on the org site when there are OPEN surveys the user has not answered.
 * Dismissals are remembered per browser session so the user is not nagged repeatedly.
 */
const SurveyPromptModal = () => {
  const { t } = useTranslation(['survey', 'common']);
  const navigate = useOrgNavigate();
  const { isAuthenticated } = useAuth();
  const [pending, setPending] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    (async () => {
      try {
        const list = await surveyApi.getActiveSurveys();
        if (!active) return;
        const dismissed = getDismissed();
        const todo = (list || []).filter((s) => !s.hasSubmitted && !dismissed.has(s.id));
        if (todo.length > 0) {
          setPending(todo);
          setOpen(true);
        }
      } catch { /* ignore — not critical */ }
    })();
    return () => { active = false; };
  }, [isAuthenticated]);

  const dismissAll = () => {
    pending.forEach((s) => addDismissed(s.id));
    setOpen(false);
  };

  const join = (id) => {
    addDismissed(id);
    setOpen(false);
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
