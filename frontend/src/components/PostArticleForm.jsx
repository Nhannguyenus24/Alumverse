import { useMemo, useCallback } from 'react';
import { Box, Stack, TextField, Typography, MenuItem, Grid, Button, FormControlLabel, Checkbox } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import WYSIWYG from './WYSIWYG';
import Input from './Input';
import Dropdown from './Dropdown';
import { useFundReceivingInfos } from '../hooks/news/useFundReceivingInfos';

const getTopicsByChannel = (t) => ({
  news: [
    { value: 'school_announcement', label: t('article:topics.school_announcement') },
    { value: 'faculty_department', label: t('article:topics.faculty_department') },
    { value: 'student_activities', label: t('article:topics.student_activities') },
    { value: 'alumni_news', label: t('article:topics.alumni_news') },
    { value: 'enterprise_cooperation', label: t('article:topics.enterprise_cooperation') },
    { value: 'academic_research', label: t('article:topics.academic_research') },
    { value: 'admission_scholarship', label: t('article:topics.admission_scholarship') },
  ],
  event: [
    { value: 'workshop', label: t('article:topics.workshop') },
    { value: 'talkshow', label: t('article:topics.talkshow') },
    { value: 'career_fair', label: t('article:topics.career_fair') },
    { value: 'networking', label: t('article:topics.networking') },
    { value: 'reunion', label: t('article:topics.reunion') },
    { value: 'academic_seminar', label: t('article:topics.academic_seminar') },
    { value: 'club_activities', label: t('article:topics.club_activities') },
  ],
  donation: [
    { value: 'student_scholarship', label: t('article:topics.student_scholarship') },
    { value: 'hardship_support', label: t('article:topics.hardship_support') },
    { value: 'research', label: t('article:topics.research') },
    { value: 'facilities', label: t('article:topics.facilities') },
    { value: 'community_activities', label: t('article:topics.community_activities') },
    { value: 'emergency', label: t('article:topics.emergency') },
  ],
  alumni: [
    { value: 'entrepreneur', label: t('article:topics.entrepreneur') },
    { value: 'technology', label: t('article:topics.technology') },
    { value: 'academic_research_alumni', label: t('article:topics.academic_research_alumni') },
    { value: 'study_abroad', label: t('article:topics.study_abroad') },
    { value: 'startup', label: t('article:topics.startup') },
    { value: 'leadership', label: t('article:topics.leadership') },
    { value: 'arts_creativity', label: t('article:topics.arts_creativity') },
  ],
  achievement: [
    { value: 'award', label: t('article:topics.award') },
    { value: 'achievement_scholarship', label: t('article:topics.achievement_scholarship') },
    { value: 'career_achievement', label: t('article:topics.career_achievement') },
    { value: 'science_research', label: t('article:topics.science_research') },
    { value: 'startup', label: t('article:topics.startup') },
    { value: 'international', label: t('article:topics.international') },
  ],
  learning: [
    { value: 'achievement_scholarship', label: t('article:topics.achievement_scholarship') },
    { value: 'masters', label: t('article:topics.masters') },
    { value: 'study_abroad', label: t('article:topics.study_abroad') },
    { value: 'online_course', label: t('article:topics.online_course') },
    { value: 'certificate', label: t('article:topics.certificate') },
    { value: 'student_exchange', label: t('article:topics.student_exchange') },
    { value: 'research', label: t('article:topics.research') },
  ],
  job: [
    { value: 'internship', label: t('article:topics.internship') },
    { value: 'full_time', label: t('article:topics.full_time') },
    { value: 'part_time', label: t('article:topics.part_time') },
    { value: 'freelance', label: t('article:topics.freelance') },
    { value: 'internal_referral', label: t('article:topics.internal_referral') },
    { value: 'remote', label: t('article:topics.remote') },
  ],
});

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
  donationData = {},
  handleDonationInputChange,
  eventData = {},
  handleEventInputChange,
  registrationQuestions = [], // event
  setRegistrationQuestions,   // event
  hideLocalQuestions = false,
  showSourceUrl = true,
}) => {
  const { t } = useTranslation(['article', 'event', 'donation']);
  const { infos: fundReceivingInfos } = useFundReceivingInfos();

  const topicsByChannel = useMemo(() => getTopicsByChannel(t), [t]);

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
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
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
      </Box>

      {/* 1. LAYOUT QUYÊN GÓP (Giữ nguyên cấu trúc Huy đã tweak) */}
      {channel === 'donation' && (
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
            {t('donation:section_title')}
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Input label={t('donation:fund_name')} name="donationFundName" value={donationData.donationFundName} onChange={handleDonationInputChange} />
          </Box>
          <Box sx={{ mb: 3 }}>
            <Input label={t('donation:manager')} name="organizer" value={donationData.organizer} onChange={handleDonationInputChange} />
          </Box>
          <Box sx={{ mb: 3 }}>
            <Dropdown
              label={t('donation:receiving_account')}
              options={fundReceivingOptions}
              value={donationData.fundReceivingInfoId ?? ''}
              onChange={(e) => handleDonationInputChange({ target: { name: 'fundReceivingInfoId', value: e.target.value } })}
            />
          </Box>
          <Box sx={{ mb: 3 }}>
            <Input label={t('donation:goal_vnd')} name="donationGoal" type="number" value={donationData.donationGoal} onChange={handleDonationInputChange} />
          </Box>
          <Box sx={{ mb: 3 }}><TextField fullWidth label={t('donation:reason')} name="reasonForDonation" multiline rows={3} value={donationData.reasonForDonation} onChange={handleDonationInputChange} /></Box>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Box sx={{ flex: 1 }}><TextField fullWidth label={t('event:start_date')} type="date" name="startDate" InputLabelProps={{ shrink: true }} value={donationData.startDate} onChange={handleDonationInputChange} /></Box>
            <Box sx={{ flex: 1 }}><TextField fullWidth label={t('event:end_date')} type="date" name="endDate" InputLabelProps={{ shrink: true }} value={donationData.endDate} onChange={handleDonationInputChange} /></Box>
          </Box>
        </Box>
      )}

      {/* 2. LAYOUT SỰ KIỆN */}
      {channel === 'event' && (
      <Box>
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

        {!hideLocalQuestions && (
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
              <Box key={q.id} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
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
              </Box>
            ))}

            <Button variant="contained" onClick={addQuestion}>
              {t('event:add_question')}
            </Button>
          </Stack>
        </Box>
        )}
      </Box>
      )}

      {/* 3. LAYOUT CỰU SINH VIÊN (Tinh giản như News) */}
      {/* Không hiển thị Box xanh, để người dùng tập trung vào Title và WYSIWYG bên dưới */}

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

      {mainImagePreview && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, mb: 1 }}>
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
        </Box>
      )}

      <Box sx={{ mt: 2 }}>
        <WYSIWYG
          value={content}
          onChange={setContent}
          placeholder={t('article:content_placeholder')}
          height={400}
        />
      </Box>

      {showSourceUrl && (
        <TextField
          fullWidth
          type="url"
          label={t('article:source_url_label')}
          placeholder="https://example.com/nguon-bai-viet"
          helperText={t('article:source_url_helper')}
          value={url ?? ''}
          onChange={(e) => setUrl?.(e.target.value)}
        />
      )}
    </Stack>
  );
};

export default PostArticleForm;
