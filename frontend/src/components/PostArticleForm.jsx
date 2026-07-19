import { useMemo, useCallback } from 'react';
import { Box, Stack, TextField, Typography, MenuItem, Grid, Button, FormControlLabel, Checkbox } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import WYSIWYG from './WYSIWYG';
import Input from './Input';
import Dropdown from './Dropdown';
import { useFundReceivingInfos } from '../hooks/news/useFundReceivingInfos';
import { getTopicsByChannel } from '../utils/articleTopics';
import {
  ScrollRevealGroup,
  ScrollRevealItem,
} from './animations/ScrollReveal';

const CAPTION_REQUIRED_CHANNELS = new Set(['news', 'alumni', 'achievement', 'job', 'learning', 'event']);

const PostArticleForm = ({
  channel,
  channelLabel,
  title,
  setTitle,
  content,
  setContent,
  topic,
  setTopic,
  url,
  setUrl,
  mainImagePreview,
  mainImageCaption,
  setMainImageCaption,
  donationData = {},
  handleDonationInputChange,
  eventData = {},
  handleEventInputChange,
  registrationQuestions = [], // event
  setRegistrationQuestions,   // event
  showSourceUrl = true,
}) => {
  const { t } = useTranslation(['article', 'event', 'donation']);
  const { infos: fundReceivingInfos } = useFundReceivingInfos();

  const topicsByChannel = useMemo(() => getTopicsByChannel(t), [t]);
  const requiresImageCaptions = CAPTION_REQUIRED_CHANNELS.has(channel);
  const showMainImageCaption = requiresImageCaptions && Boolean(mainImagePreview);

  const fundReceivingOptions = useMemo(
    () => fundReceivingInfos.map((i) => ({
      value: i.id,
      label: `${i.bankName ?? ''} - ${i.accountName ?? ''} (${i.accountNumber ?? ''})`,
    })),
    [fundReceivingInfos]
  );

  // Câu hỏi event
  const addQuestion = useCallback(() => {
    setRegistrationQuestions((prev) => [
      ...prev,
      { id: Date.now(), label: "", type: "shortText", required: false, options: [""] },
    ]);
  }, [setRegistrationQuestions]);

  const updateQuestion = useCallback((id, field, value) => {
    setRegistrationQuestions((prev) => prev.map((q) => q.id === id ? { ...q, [field]: value } : q));
  }, [setRegistrationQuestions]);

  const removeQuestion = useCallback((id) => {
    setRegistrationQuestions((prev) => prev.filter((q) => q.id !== id));
  }, [setRegistrationQuestions]);

  const updateOption = useCallback((questionId, optionIndex, value) => {
    setRegistrationQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      })
    );
  }, [setRegistrationQuestions]);

  const addOption = useCallback((questionId) => {
    setRegistrationQuestions((prev) =>
      prev.map((q) => q.id === questionId ? { ...q, options: [...q.options, ""] } : q)
    );
  }, [setRegistrationQuestions]);

  return (
    <ScrollRevealGroup
      stagger={0.08}
      sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
    >
      <ScrollRevealItem sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <TextField
          fullWidth
          label={t('article:channel')}
          value={channelLabel}
          InputProps={{ readOnly: true, sx: { fontWeight: 800, color: 'primary.main' } }}
        />

        <TextField
          select
          fullWidth
          label={t('article:topic')}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        >
          {(topicsByChannel[channel] || []).map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </TextField>
      </ScrollRevealItem>

      {/* 1. LAYOUT QUYÊN GÓP (Giữ nguyên cấu trúc Huy đã tweak) */}
      {channel === 'donation' && (
        <ScrollRevealItem
          sx={(theme) => ({
            backgroundColor: alpha(theme.palette.info.main, theme.palette.mode === 'dark' ? 0.12 : 0.08),
            border: '1px solid',
            borderColor: alpha(theme.palette.info.main, theme.palette.mode === 'dark' ? 0.28 : 0.18),
            borderRadius: 2,
            p: { xs: 2, sm: 3, md: 4 },
            my: 2,
          })}
        >
          <ScrollRevealGroup stagger={0.07} sx={{ display: 'flex', flexDirection: 'column' }}>
            <ScrollRevealItem>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 3, color: 'primary.main' }}>
                {t('donation:section_title')}
              </Typography>
            </ScrollRevealItem>
            <ScrollRevealItem sx={{ mb: 3 }}>
              <Input label={t('donation:fund_name')} name="donationFundName" value={donationData.donationFundName} onChange={handleDonationInputChange} />
            </ScrollRevealItem>
            <ScrollRevealItem sx={{ mb: 3 }}>
              <Input label={t('donation:manager')} name="organizer" value={donationData.organizer} onChange={handleDonationInputChange} />
            </ScrollRevealItem>
            <ScrollRevealItem sx={{ mb: 3 }}>
              <Dropdown
                label={t('donation:receiving_account')}
                options={fundReceivingOptions}
                value={donationData.fundReceivingInfoId ?? ''}
                onChange={(e) => handleDonationInputChange({ target: { name: 'fundReceivingInfoId', value: e.target.value } })}
              />
            </ScrollRevealItem>
            <ScrollRevealItem sx={{ mb: 3 }}>
              <Input label={t('donation:goal_vnd')} name="donationGoal" type="number" value={donationData.donationGoal} onChange={handleDonationInputChange} />
            </ScrollRevealItem>
            <ScrollRevealItem sx={{ mb: 3 }}><TextField fullWidth label={t('donation:reason')} name="reasonForDonation" multiline rows={3} value={donationData.reasonForDonation} onChange={handleDonationInputChange} /></ScrollRevealItem>
            <ScrollRevealItem sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Box sx={{ flex: 1 }}><TextField fullWidth label={t('event:start_date')} type="date" name="startDate" InputLabelProps={{ shrink: true }} value={donationData.startDate} onChange={handleDonationInputChange} /></Box>
              <Box sx={{ flex: 1 }}><TextField fullWidth label={t('event:end_date')} type="date" name="endDate" InputLabelProps={{ shrink: true }} value={donationData.endDate} onChange={handleDonationInputChange} /></Box>
            </ScrollRevealItem>
          </ScrollRevealGroup>
        </ScrollRevealItem>
      )}

      {/* 2. LAYOUT SỰ KIỆN */}
      {channel === 'event' && (
      <ScrollRevealItem>
        <Box
          sx={(theme) => ({
            backgroundColor: alpha(theme.palette.info.main, theme.palette.mode === 'dark' ? 0.12 : 0.08),
            border: '1px solid',
            borderColor: alpha(theme.palette.info.main, theme.palette.mode === 'dark' ? 0.28 : 0.18),
            borderRadius: 2,
            p: { xs: 2, sm: 3, md: 4 },
            my: 2,
          })}
        >
          <Typography variant="h6" fontWeight={700} sx={{ mb: 3, color: 'primary.main' }}>
            {t('event:section_title')}
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Input label={t('event:location')} placeholder={t('event:location_placeholder')} name="location" value={eventData.location} onChange={handleEventInputChange} />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Box sx={{ flex: 1 }}>
              <Input label={t('event:max_participants')} type="number" name="maxParticipants" value={eventData.maxParticipants} onChange={handleEventInputChange} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label={t('event:registration_start')}
                type="date"
                name="registrationStartAt"
                InputLabelProps={{ shrink: true }}
                value={eventData.registrationStartAt}
                onChange={handleEventInputChange}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label={t('event:registration_end')}
                type="date"
                name="deadline"
                InputLabelProps={{ shrink: true }}
                value={eventData.deadline}
                onChange={handleEventInputChange}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Box sx={{ flex: 1 }}>
              <TextField fullWidth label={t('event:start_date')} type="date" name="startDate" InputLabelProps={{ shrink: true }} value={eventData.startDate} onChange={handleEventInputChange} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField fullWidth label={t('event:end_date')} type="date" name="endDate" InputLabelProps={{ shrink: true }} value={eventData.endDate} onChange={handleEventInputChange} />
            </Box>
          </Box>
        </Box>

        <Box
          sx={(theme) => ({
            backgroundColor: alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.14 : 0.1),
            border: '1px solid',
            borderColor: alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.32 : 0.22),
            borderRadius: 2,
            p: { xs: 2, sm: 3, md: 4 },
            my: 2,
          })}
        >
          <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ mb: 3 }}>
            {t('event:questions_section_title')}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('event:questions_section_desc')}
          </Typography>

          <Stack spacing={3}>
            {registrationQuestions.map((q, index) => (
              <ScrollRevealItem key={q.id} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label={t('event:question_label', { number: index + 1 })}
                    value={q.label}
                    onChange={(e) => updateQuestion(q.id, "label", e.target.value)}
                  />

                  <Dropdown
                    label={t('event:question_type')}
                    value={q.type}
                    options={[
                      { value: "shortText", label: t('event:q_short_text') },
                      { value: "singleChoice", label: t('event:q_single_choice') },
                      { value: "multiChoice", label: t('event:q_multi_choice') },
                    ]}
                    onChange={(e) => updateQuestion(q.id, "type", e.target.value)}
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(q.required)}
                        onChange={(e) => updateQuestion(q.id, "required", e.target.checked)}
                      />
                    }
                    label={t('event:required_answer')}
                  />

                  {(q.type === "singleChoice" || q.type === "multiChoice") && (
                    <Stack spacing={1}>
                      {q.options.map((option, i) => (
                        <TextField
                          key={i}
                          fullWidth
                          label={t('event:option_label', { number: i + 1 })}
                          value={option}
                          onChange={(e) => updateOption(q.id, i, e.target.value)}
                        />
                      ))}

                      <Button variant="outlined" size="small" onClick={() => addOption(q.id)}>
                        {t('event:add_option')}
                      </Button>
                    </Stack>
                  )}

                  <Button color="error" variant="outlined" onClick={() => removeQuestion(q.id)}>
                    {t('event:delete_question')}
                  </Button>
                </Stack>
              </ScrollRevealItem>
            ))}

            <Button variant="contained" onClick={addQuestion}>
              {t('event:add_question')}
            </Button>
          </Stack>
        </Box>
      </ScrollRevealItem>
      )}

      {/* 3. LAYOUT CỰU SINH VIÊN (Tinh giản như News) */}
      {/* Không hiển thị Box xanh, để người dùng tập trung vào Title và WYSIWYG bên dưới */}

      <ScrollRevealItem>
        <TextField
          fullWidth
          variant="standard"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('article:title_placeholder')}
          InputProps={{
            disableUnderline: true,
            sx: { fontSize: '1.15rem', fontWeight: 600, pb: 1, borderBottom: '1px solid', borderColor: 'divider' },
          }}
        />
      </ScrollRevealItem>

      {mainImagePreview && (
        <ScrollRevealItem sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 1, mb: 1 }}>
          <Box
            component="img"
            src={mainImagePreview}
            alt={title || 'Main photo preview'}
            sx={{
              width: 'auto',
              maxWidth: { xs: '100%', md: '72%' },
              height: 'auto',
              objectFit: 'contain',
              borderRadius: 2,
              boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
            }}
          />
          {showMainImageCaption && (
            <TextField
              fullWidth
              size="small"
              label={t('article:main_image_caption_label')}
              placeholder={t('article:image_caption_placeholder')}
              helperText={t('article:main_image_caption_helper')}
              value={mainImageCaption ?? ''}
              onChange={(e) => setMainImageCaption?.(e.target.value)}
              sx={{ mt: 1.5, maxWidth: { xs: '100%', md: '72%' } }}
            />
          )}
        </ScrollRevealItem>
      )}

      <ScrollRevealItem sx={{ mt: 2 }}>
        <WYSIWYG
          value={content}
          onChange={setContent}
          placeholder={t('article:content_placeholder')}
          height={400}
          requireImageCaptions={requiresImageCaptions}
        />
      </ScrollRevealItem>

      {showSourceUrl && (
        <ScrollRevealItem>
          <TextField
            fullWidth
            type="url"
            label={t('article:source_url_label')}
            placeholder="https://example.com/nguon-bai-viet"
            helperText={t('article:source_url_helper')}
            value={url ?? ''}
            onChange={(e) => setUrl?.(e.target.value)}
          />
        </ScrollRevealItem>
      )}
    </ScrollRevealGroup>
  );
};

export default PostArticleForm;
