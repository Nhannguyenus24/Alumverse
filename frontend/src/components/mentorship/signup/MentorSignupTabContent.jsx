import {
  Box,
  Button,
  Card,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { validateMeetingLink, meetingLinkPasswordWarning } from '../../../utils/meetingLink';

const CATEGORIES = [
  { value: 'CAREER', label: 'Định hướng / Chia sẻ kinh nghiệm nghề nghiệp' },
  { value: 'ACADEMIC', label: 'Kinh nghiệm học tập / Học bổng / Nghiên cứu' },
  { value: 'SOFT_SKILLS', label: 'Kỹ năng mềm' },
];

const blank = () => ({ category: 'CAREER', name: '', description: '', tag: '' });

const MentorSignupTabContent = ({ values, onChange }) => {
  const items = values.expertises ?? [];
  const meetingLink = values.defaultMeetingLink ?? '';
  const meetingLinkError = validateMeetingLink(meetingLink, { optional: true });
  const meetingLinkWarn = meetingLinkPasswordWarning(meetingLink);

  const updateExpertises = (next) => onChange({ ...values, expertises: next });
  const updateMeetingLink = (val) => onChange({ ...values, defaultMeetingLink: val });

  const handleAdd = () => updateExpertises([...items, blank()]);
  const handleRemove = (idx) => updateExpertises(items.filter((_, i) => i !== idx));
  const handleField = (idx, key, value) =>
    updateExpertises(items.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));

  return (
    <Stack spacing={3}>
      <Box>
        <Typography fontWeight={700}>
          Nội dung có thể chia sẻ
          <Typography component="span" color="error.main">{' *'}</Typography>
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
          Mỗi nội dung gồm: tên, mô tả, tag — thuộc 1 trong 3 mục bên dưới. Cần ≥ 1 nội dung.
        </Typography>

        {items.length === 0 ? (
          <Card sx={{ p: 2, border: '1px dashed', borderColor: 'divider', textAlign: 'center' }} elevation={0}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Chưa có nội dung nào.
            </Typography>
            <Button startIcon={<AddIcon />} onClick={handleAdd}>
              Thêm nội dung đầu tiên
            </Button>
          </Card>
        ) : (
          <Stack spacing={1.5}>
            {items.map((item, idx) => (
              <Card key={idx} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                <Stack spacing={1.5}>
                  <TextField
                    select
                    label="Mục"
                    size="small"
                    value={item.category}
                    onChange={(e) => handleField(idx, 'category', e.target.value)}
                    fullWidth
                  >
                    {CATEGORIES.map((c) => (
                      <MenuItem key={c.value} value={c.value}>
                        {c.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Tên kỹ năng / kinh nghiệm"
                    size="small"
                    value={item.name}
                    onChange={(e) => handleField(idx, 'name', e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Mô tả"
                    size="small"
                    value={item.description}
                    onChange={(e) => handleField(idx, 'description', e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                  <TextField
                    label="Tag"
                    size="small"
                    placeholder="VD: react, system-design"
                    value={item.tag}
                    onChange={(e) => handleField(idx, 'tag', e.target.value)}
                    fullWidth
                  />
                  <Stack direction="row" justifyContent="flex-end">
                    <IconButton size="small" color="error" onClick={() => handleRemove(idx)}>
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Stack>
                </Stack>
              </Card>
            ))}
            <Box>
              <Button startIcon={<AddIcon />} onClick={handleAdd}>
                Thêm nội dung
              </Button>
            </Box>
          </Stack>
        )}
      </Box>

      <Box>
        <Typography fontWeight={700} mb={1}>
          Link cuộc họp mặc định
        </Typography>
        <TextField
          placeholder="VD: https://meet.google.com/abc-defg-hij"
          value={meetingLink}
          onChange={(e) => updateMeetingLink(e.target.value)}
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
