import { useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Stack, Box, Chip,
} from '@mui/material';
import PollOutlinedIcon from '@mui/icons-material/PollOutlined';
import { useTranslation } from 'react-i18next';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useAuth } from '../../hooks/useAuth';
import useSurveyPromptStore from '../../stores/surveyPromptStore';
import { normalizeRichTextHtml } from '../../utils/stringUtils';

const normalizePromptDescription = (html) => {
  const cleanHtml = normalizeRichTextHtml(html);
  if (!cleanHtml) return '';

  if (typeof document === 'undefined') {
    return cleanHtml
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .join('\n');
  }

  const container = document.createElement('div');
  container.innerHTML = cleanHtml;

  container.querySelectorAll('p, div').forEach((element) => {
    const text = element.textContent?.replace(/\u00a0/g, ' ').trim() || '';
    const hasMedia = element.querySelector('img, video, iframe, table, ul, ol');
    if (!text && !hasMedia) {
      element.remove();
    }
  });

  Array.from(container.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent = node.textContent
        .split(/\r?\n/)
        .filter((line) => line.trim())
        .join('\n');
    }
  });

  return container.innerHTML;
};

/**
 * Popup listing OPEN surveys the user has not answered.
 * Auto-shows on entry (once per session), and can be re-opened anytime from the
 * floating survey action. State lives in {@link useSurveyPromptStore}.
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
  const primarySurvey = pending[0];

  return (
    <Dialog
      open={open}
      onClose={dismissAll}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            width: { xs: 'calc(100% - 32px)', sm: 560 },
            maxWidth: 'calc(100% - 32px)',
          },
        },
      }}
    >
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <PollOutlinedIcon color="primary" />
          <Typography component="span" variant="h6" sx={{ color: 'primary.main', fontWeight: 800 }}>
            {t('survey:prompt_title')}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2, fontSize: '0.95rem', lineHeight: 1.7, textAlign: 'justify' }}
        >
          {t('survey:prompt_subtitle')}
        </Typography>
        <Stack spacing={1.5}>
          {pending.map((s) => (
            <Box key={s.id} sx={{ p: { xs: 1.5, sm: 2 }, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 800, lineHeight: 1.25 }}>
                {s.title}
              </Typography>
              {s.description && (
                <Box
                  sx={{
                    mt: 1.25,
                    mb: 1.5,
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                    lineHeight: 1.65,
                    whiteSpace: 'pre-line',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    '& p': {
                      m: 0,
                      textAlign: 'justify',
                      minHeight: '1.45em',
                      '&:not(:last-child)': { mb: 2 },
                    },
                    '& p.ql-empty-line, & p:has(> br:only-child)': {
                      display: 'block',
                      minHeight: '1.8em',
                      lineHeight: '1.8em',
                      my: 0.25,
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
                  dangerouslySetInnerHTML={{ __html: normalizePromptDescription(s.description) }}
                />
              )}
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                <Chip
                  size="small"
                  color="accent"
                  label={`${s.questions?.length ?? 0} ${t('survey:questions_count')}`}
                  sx={{
                    fontWeight: 800,
                    bgcolor: 'accent.main',
                    color: 'accent.contrastText',
                    '& .MuiChip-label': { fontWeight: 800 },
                  }}
                />
              </Stack>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button variant="outlined" color="secondary" onClick={dismissAll}>
          {t('survey:prompt_skip')}
        </Button>
        <Button variant="contained" onClick={() => join(primarySurvey.id)}>
          {t('survey:prompt_join')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SurveyPromptModal;
