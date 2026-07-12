

import { useTranslation } from 'react-i18next';



const MentorSignupTabTerms = ({ values, onChange }) => {
  const { t } = useTranslation('mentorship');
  const accepted = Boolean(values.termsAccepted);

  const commitments = [
    t('signup_terms_commitment_1'),
    t('signup_terms_commitment_2'),
    t('signup_terms_commitment_3'),
    t('signup_terms_commitment_4'),
    t('signup_terms_commitment_5'),
    t('signup_terms_commitment_6'),
  ];

  return (
    <ScrollRevealGroup stagger={0.09} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <ScrollRevealItem><Typography fontWeight={700}>{t('signup_terms_title')}</Typography></ScrollRevealItem>

      <ScrollRevealItem><Paper
        variant="outlined"
        sx={{ p: 2.5, maxHeight: 360, overflowY: 'auto', bgcolor: 'background.default' }}
      >
        <Stack spacing={1.5} sx={{ color: 'text.secondary' }}>
          <Typography variant="body2">
            {t('signup_terms_intro')}
          </Typography>

          <Typography variant="body2" fontWeight={600} color="text.primary">
            {t('signup_terms_agree_header')}
          </Typography>

          <Box component="ol" sx={{ pl: 3, m: 0 }}>
            {commitments.map((item, index) => (
              <Typography key={index} component="li" variant="body2" sx={{ mb: 0.75 }}>
                {item}
              </Typography>
            ))}
          </Box>

          <Typography variant="body2">
            {t('signup_terms_penalty')}
          </Typography>
        </Stack>
      </Paper></ScrollRevealItem>

      <ScrollRevealItem><FormControlLabel
        control={
          <Checkbox
            checked={accepted}
            onChange={(e) => onChange({ ...values, termsAccepted: e.target.checked })}
          />
        }
        label={t('signup_terms_accept_label')}
      /></ScrollRevealItem>
    </ScrollRevealGroup>
  );
};

export default MentorSignupTabTerms;
