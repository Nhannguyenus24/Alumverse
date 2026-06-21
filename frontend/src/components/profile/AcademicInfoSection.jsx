import { useMemo, useState } from 'react';
import { Box, Grid, IconButton, Stack, Typography } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import VerifiedIcon from '@mui/icons-material/Verified';
import SchoolIcon from '@mui/icons-material/School';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import AcademicInfoRowCard from './AcademicInfoRowCard';
import ProfileSectionTitle from './ProfileSectionTitle';
import { ACADEMIC_EMPTY_LABEL, buildAcademicRecords } from '../../utils/academicUtils';

const ACADEMIC_FIELD_CONFIG = [
  { key: 'faculty', label: 'Khoa', icon: AccountBalanceIcon },
  { key: 'major', label: 'Chuyên ngành', icon: AccountTreeIcon },
  { key: 'program', label: 'Chương trình', icon: MenuBookIcon },
  { key: 'startedYear', label: 'Khoá', icon: CalendarMonthIcon },
  { key: 'graduatedYear', label: 'Năm tốt nghiệp', icon: EventAvailableIcon },
  { key: 'graduationStatus', label: 'Trạng thái tốt nghiệp', icon: VerifiedIcon },
];

const AcademicInfoSection = ({ academicProfile }) => {
  const records = useMemo(
    () => buildAcademicRecords(academicProfile),
    [academicProfile],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const safeActiveIndex = Math.min(activeIndex, records.length - 1);
  const activeRecord = records[safeActiveIndex] ?? records[0] ?? {};
  const hasMultipleRecords = records.length > 1;
  const activeAcademicLabel =
    activeRecord.program || `Học thuật ${safeActiveIndex + 1}`;

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
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        mb={2}
      >
        <ProfileSectionTitle icon={SchoolIcon} sx={{ mb: 0 }}>
          Thông tin học thuật
        </ProfileSectionTitle>

        {hasMultipleRecords ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              size="small"
              type="button"
              disableRipple
              aria-label="Xem bộ học thuật trước"
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
              aria-label="Xem bộ học thuật tiếp theo"
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
      </Stack>

      <Grid container spacing={3} sx={{ py: 1.75 }}>
        {ACADEMIC_FIELD_CONFIG.map((field) => (
          <Grid key={field.key} size={{ xs: 12, sm: 6, md: 4 }}>
            <AcademicInfoRowCard
              icon={field.icon}
              label={field.label}
              value={activeRecord[field.key] || ACADEMIC_EMPTY_LABEL}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AcademicInfoSection;
