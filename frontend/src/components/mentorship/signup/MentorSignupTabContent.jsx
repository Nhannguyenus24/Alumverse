import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { validateMeetingLink, meetingLinkPasswordWarning } from '../../../utils/meetingLink';
import { extractMentorshipSkills } from '../../../utils/api';

/**
 * Tab 2 of mentor signup. The mentor pastes a free-text description of their
 * experience; AI (ME-02) extracts skill tags used for mentee filtering. Tags
 * are editable (remove / add manually). The pasted summary is saved on the
 * profile (extendedProfile.experienceSummary).
 */
const MentorSignupTabContent = ({ values, onChange }) => {
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
        setExtractError('AI chưa trích được thẻ nào. Bạn có thể thêm thẻ thủ công bên dưới.');
      } else {
        addTags(got);
      }
    } catch (err) {
      setExtractError(
        err?.response?.data?.message ??
          'Không trích xuất được thẻ. Vui lòng thử lại hoặc thêm thẻ thủ công.',
      );
    } finally {
      setExtracting(false);
      setExtractAttempted(true);
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography fontWeight={700}>
          Kinh nghiệm &amp; kỹ năng
          <Typography component="span" color="error.main">{' *'}</Typography>
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
          Mô tả kinh nghiệm, chuyên môn của bạn trong một đoạn văn, rồi nhấn “Trích xuất thẻ”. AI sẽ
          tự tạo các thẻ # giúp mentee tìm đúng bạn — không cần nhập tay từng mục.
        </Typography>

        <TextField
          placeholder="VD: Mình có 5 năm làm backend Java Spring, từng phỏng vấn tuyển dụng và hướng dẫn thực tập sinh. Quan tâm tới system design và mentoring sinh viên năm cuối."
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
            {extracting ? 'Đang phân tích...' : 'Trích xuất thẻ'}
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
              Thẻ kỹ năng (mentee dùng để lọc tìm cố vấn). Bấm × để xoá, hoặc thêm thẻ bên dưới.
            </Typography>
            {tags.length > 0 ? (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {tags.map((tag) => (
                  <Chip key={tag} label={`#${tag}`} onDelete={() => removeTag(tag)} color="primary" variant="outlined" />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.disabled">
                Chưa có thẻ nào — thêm thủ công bên dưới.
              </Typography>
            )}

            <Stack direction="row" spacing={1} mt={1.5}>
              <TextField
                size="small"
                placeholder="Thêm thẻ thủ công (Enter để thêm)"
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
                Thêm
              </Button>
            </Stack>
          </Box>
        )}
      </Box>

      <Box>
        <Typography fontWeight={700} mb={1}>
          Link cuộc họp mặc định
        </Typography>
        <TextField
          placeholder="VD: https://meet.google.com/abc-defg-hij"
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
          (Không bắt buộc) Mentee sẽ nhận link này khi bạn duyệt yêu cầu. Chỉ chấp nhận link từ Google
          Meet, Zoom, Microsoft Teams, Jitsi Meet, Whereby, Webex, GoToMeeting.
        </Typography>
      </Box>
    </Stack>
  );
};

export default MentorSignupTabContent;
