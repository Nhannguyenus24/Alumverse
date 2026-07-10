import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useTranslation } from 'react-i18next';
import { validateMeetingLink, meetingLinkPasswordWarning } from '../../../utils/meetingLink';
import { extractMentorshipSkills } from '../../../utils/api';
import TagPriorityList from './TagPriorityList';
import {
  ScrollRevealGroup,
  ScrollRevealItem,
} from '../../animations/ScrollReveal';

/**
 * Tab 2 of mentor signup. The mentor pastes a free-text description of their
 * experience; AI (ME-02) extracts skill tags used for mentee filtering. Tags
 * are editable (remove / add manually). The pasted summary is saved on the
 * profile (extendedProfile.experienceSummary).
 */
const MentorSignupTabContent = ({ values, onChange }) => {
  const { t } = useTranslation('mentorship');
  const summary = values.experienceSummary ?? '';
  const tags = values.expertiseTags ?? [];
  const meetingLink = values.defaultMeetingLink ?? '';
  const meetingLinkError = validateMeetingLink(meetingLink, { optional: true });
  const meetingLinkWarn = meetingLinkPasswordWarning(meetingLink);

  const update = (patch) => onChange({ ...values, ...patch });

  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState(null);
  const [extractAttempted, setExtractAttempted] = useState(false);
  const [manualTag, setManualTag] = useState('');

  // The tag list + editing controls only appear once the user has run an
  // extraction (or a draft already has tags) — keeps the initial view focused
  // on writing the description.
  const showTagEditor = extractAttempted || tags.length > 0;

  const addTags = (incoming) => {
    const existing = new Set(tags.map((t) => t.toLowerCase()));
    const merged = [...tags];
    incoming.forEach((raw) => {
      // Normalize to a hashtag-safe keyword: drop leading '#', collapse
      // whitespace into underscores so every chip is a single token.
      const v = (raw ?? '').trim().replace(/^#+/, '').replace(/\s+/g, '_');
      if (v && !existing.has(v.toLowerCase())) {
        existing.add(v.toLowerCase());
        merged.push(v);
      }
    });
    update({ expertiseTags: merged });
  };
  const removeTag = (tag) => update({ expertiseTags: tags.filter((t) => t !== tag) });
  const handleManualAdd = () => {
    if (!manualTag.trim()) return;
    addTags([manualTag]);
    setManualTag('');
  };

  const handleExtract = async () => {
    const text = summary.trim();
    if (!text) return;
    setExtracting(true);
    setExtractError(null);
    try {
      const res = await extractMentorshipSkills(text);
      const got = res?.data?.data?.tags ?? [];
      if (got.length === 0) {
        setExtractError(t('signup_tab_extract_empty'));
      } else {
        addTags(got);
      }
    } catch (err) {
      setExtractError(
        err?.response?.data?.message ?? t('signup_tab_extract_error'),
      );
    } finally {
      setExtracting(false);
      setExtractAttempted(true);
    }
  };

  return (
    <ScrollRevealGroup stagger={0.09} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <ScrollRevealItem>
        <Typography fontWeight={700}>
          {t('signup_tab_content_title')}
          <Typography component="span" color="error.main">{' *'}</Typography>
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
          {t('signup_tab_content_desc')}
        </Typography>

        <TextField
          placeholder={t('signup_tab_content_placeholder')}
          value={summary}
          onChange={(e) => update({ experienceSummary: e.target.value })}
          fullWidth
          multiline
          minRows={3}
          maxRows={8}
        />

        <Stack direction="row" spacing={1} mt={1.5} alignItems="center" justifyContent="flex-end">
          <Button
            variant="contained"
            startIcon={extracting ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
            onClick={handleExtract}
            disabled={extracting || !summary.trim()}
          >
            {extracting ? t('signup_tab_extract_analyzing') : t('signup_tab_extract_btn')}
          </Button>
        </Stack>

        {extractError && (
          <Alert severity="info" sx={{ mt: 1.5 }}>
            {extractError}
          </Alert>
        )}

        {showTagEditor && (
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              {t('signup_tab_tags_hint')}
            </Typography>
            {tags.length > 0 ? (
              <TagPriorityList
                tags={tags}
                onReorder={(next) => update({ expertiseTags: next })}
                onRemove={removeTag}
              />
            ) : (
              <Typography variant="body2" color="text.disabled">
                {t('signup_tab_no_tags')}
              </Typography>
            )}

            <Stack direction="row" spacing={1} mt={1.5}>
              <TextField
                size="small"
                placeholder={t('signup_tab_manual_tag_placeholder')}
                value={manualTag}
                onChange={(e) => setManualTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleManualAdd();
                  }
                }}
              />
              <Button onClick={handleManualAdd} startIcon={<AddIcon />} disabled={!manualTag.trim()}>
                {t('signup_tab_add_btn')}
              </Button>
            </Stack>
          </Box>
        )}
      </ScrollRevealItem>

      <ScrollRevealItem>
        <Typography fontWeight={700} mb={1}>
          {t('signup_tab_meeting_link_title')}
        </Typography>
        <TextField
          placeholder={t('signup_tab_meeting_link_placeholder')}
          value={meetingLink}
          onChange={(e) => update({ defaultMeetingLink: e.target.value })}
          fullWidth
          size="small"
          error={Boolean(meetingLinkError)}
          helperText={meetingLinkError ?? undefined}
        />
        {meetingLinkWarn && (
          <Typography variant="caption" color="warning.main" display="block" mt={0.5}>
            {meetingLinkWarn}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
          {t('signup_tab_meeting_link_hint')}
        </Typography>
      </ScrollRevealItem>
    </ScrollRevealGroup>
  );
};

export default MentorSignupTabContent;
