import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import VerifiedIcon from '@mui/icons-material/Verified';
import SchoolIcon from '@mui/icons-material/School';

import { buildAcademicRecords } from '../../utils/academicUtils';
import { getStaggerDelay } from '../animations/ScrollReveal';

const ACADEMIC_FIELD_CONFIG = [
  { key: 'faculty', labelKey: 'field_faculty', icon: AccountBalanceIcon },
  { key: 'major', labelKey: 'field_major', icon: AccountTreeIcon },
  { key: 'program', labelKey: 'field_program', icon: MenuBookIcon },
  { key: 'startedYear', labelKey: 'field_started_year', icon: CalendarMonthIcon },
  { key: 'graduatedYear', labelKey: 'field_graduated_year', icon: EventAvailableIcon },
  { key: 'graduationStatus', labelKey: 'field_graduation_status', icon: VerifiedIcon },
];

const AcademicInfoSection = ({ academicProfile }) => {
  const { t } = useTranslation(['profile']);
  const records = useMemo(
    () => buildAcademicRecords(academicProfile),
    [academicProfile],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const safeActiveIndex = Math.min(activeIndex, records.length - 1);
  const activeRecord = records[safeActiveIndex] ?? records[0] ?? {};
  const hasMultipleRecords = records.length > 1;
  const activeAcademicLabel =
    activeRecord.program || t('profile:academic_record_label', { index: safeActiveIndex + 1 });

  const moveRecord = (direction) => {
    setActiveIndex((current) => {
      const next = current + direction;
      if (next < 0) return records.length - 1;
      if (next >= records.length) return 0;
      return next;
    });
  };

  return (
    <Box>
      <ScrollReveal><Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        mb={2}
      >
        <ProfileSectionTitle icon={SchoolIcon} sx={{ mb: 0 }}>
          {t('profile:academic_info')}
        </ProfileSectionTitle>

        {hasMultipleRecords ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              size="small"
              type="button"
              disableRipple
              aria-label={t('profile:prev_academic_record')}
              onClick={() => moveRecord(-1)}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: 'transparent',
                },
              }}
            >
              <ChevronLeftIcon fontSize="medium" />
            </IconButton>
            <Typography
              variant="subtitle1"
              color="secondary.main"
              sx={{ minWidth: 70, textAlign: 'center' }}
            >
              {activeAcademicLabel}
            </Typography>
            <IconButton
              size="small"
              type="button"
              disableRipple
              aria-label={t('profile:next_academic_record')}
              onClick={() => moveRecord(1)}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: 'transparent',
                },
              }}
            >
              <ChevronRightIcon fontSize="medium" />
            </IconButton>
          </Stack>
        ) : null}
      </Stack></ScrollReveal>

      <Grid container spacing={3} sx={{ py: 1.75 }}>
        {ACADEMIC_FIELD_CONFIG.map((field) => (
          <Grid key={field.key} size={{ xs: 12, sm: 6, md: 4 }}>
            <ScrollReveal delay={getStaggerDelay(ACADEMIC_FIELD_CONFIG.indexOf(field), 0.07)}>
              <AcademicInfoRowCard
                icon={field.icon}
                label={t(`profile:${field.labelKey}`)}
                value={(field.key === 'faculty'
                  ? activeRecord.faculty || activeRecord.organizationName
                  : activeRecord[field.key]) || t('profile:not_updated')}
              />
            </ScrollReveal>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AcademicInfoSection;
