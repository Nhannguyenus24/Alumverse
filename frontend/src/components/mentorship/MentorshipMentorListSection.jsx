import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';

import SearchBar from '../SearchBar';
import MentorshipCard from './MentorshipCard';
import DynamicFilterBar from '../DynamicFilterBar';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useBrowseMentors } from '../../hooks/mentorship/useBrowseMentors';
import { useMentorshipAccessState } from '../../hooks/mentorship/useMentorshipAccessState';
import { useSkillSearch } from '../../hooks/mentorship/useSkillSearch';
import { formatRating } from '../../utils/numberFormatter';
import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
} from '../animations/ScrollReveal';

const PAGE_SIZE = 9;

const startOfDayIso = (dateStr) => (dateStr ? `${dateStr}T00:00:00` : '');
const endOfDayIso = (dateStr) => (dateStr ? `${dateStr}T23:59:59` : '');

const MentorshipMentorListSection = () => {
  const { t } = useTranslation(['mentorship']);
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    all: true,
    skills: [],
    status: [],
    availableOn: '',
  });

  const access = useMentorshipAccessState();
  const ownMentorMemberId = access.mentorMemberId;
  const browseEnabled = access.canPreviewMentors;
  const skillsQuery = useSkillSearch('', { enabled: browseEnabled });
  const skillOptions = useMemo(
    () => (skillsQuery.data ?? []).map((skill) => ({
      value: skill.id,
      label: skill.name,
    })),
    [skillsQuery.data],
  );

  const filterConfig = useMemo(
    () => [
      {
        type: 'dropdown',
        key: 'skills',
        label: t('mentorship:filter_field'),
        multiple: true,
        options: skillOptions,
      },
      {
        type: 'date',
        key: 'availableOn',
        label: t('mentorship:filter_available_date'),
      },
      {
        type: 'topics',
        key: 'status',
        options: [t('mentorship:filter_trending')],
      },
    ],
    [skillOptions, t],
  );

  const skillIds = filters.skills ?? [];
  const hasAvailability = (filters.status ?? []).includes(t('mentorship:filter_trending'));
  const availableFrom = startOfDayIso(filters.availableOn);
  const availableTo = endOfDayIso(filters.availableOn);

  const browseQuery = useBrowseMentors({
    keyword: searchQuery,
    skillIds,
    hasAvailability,
    availableFrom,
    availableTo,
    page,
    limit: PAGE_SIZE,
    enabled: browseEnabled,
  });

  const paginated = browseQuery.data;
  const mentors = useMemo(() => paginated?.items ?? [], [paginated]);

  const handleViewProfile = (mentorMemberId) =>
    navigate(`/mentorship/mentors/${mentorMemberId}`);

  const handleBook = (mentorMemberId) => {
    if (!access.canUseMentorship) {
      enqueueSnackbar(t('mentorship:snack_need_verification_to_book'), {
        variant: 'warning',
      });
      navigate('/settings/account');
      return;
    }
    if (!access.hasJoinedMentorship) {
      enqueueSnackbar(t('mentorship:snack_need_join_to_book'), {
        variant: 'warning',
      });
      navigate('/mentorship/mentee-signup');
      return;
    }
    navigate(`/mentorship/mentors/${mentorMemberId}/book`);
  };

  const bookDisabledReason = !access.canUseMentorship
    ? t('mentorship:need_academic_verification_to_book')
    : !access.hasJoinedMentorship
      ? t('mentorship:need_mentee_signup_to_book')
      : undefined;

  return (
    <ScrollRevealGroup stagger={0.08} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {access.needsOrgVerification && (
        <ScrollRevealItem><Alert severity="info">{t('mentorship:preview_mode_alert')}</Alert></ScrollRevealItem>
      )}

      <ScrollRevealItem>
        <Typography variant="h4" fontWeight={700} mb={2}>
          {t('mentorship:find_mentor_title')}
        </Typography>
        <SearchBar
          value={searchQuery}
          onChange={(v) => {
            setSearchQuery(v);
            setPage(0);
          }}
          placeholder={t('mentorship:search_mentor_placeholder')}
        />
      </ScrollRevealItem>

      <ScrollRevealItem><DynamicFilterBar
        config={filterConfig}
        value={filters}
        onChange={(next) => {
          setFilters(next);
          setPage(0);
        }}
      /></ScrollRevealItem>

      {browseQuery.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : browseQuery.isError ? (
        <Alert severity="error">{t('mentorship:load_mentors_error')}</Alert>
      ) : mentors.length === 0 ? (
        <Alert severity="info">
          {searchQuery.trim()
            ? t('mentorship:no_mentor_search_result', { query: searchQuery })
            : t('mentorship:no_mentor_in_system')}
        </Alert>
      ) : (
        <ScrollRevealGroup
          stagger={0.07}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
            gap: 3,
          }}
        >
          {mentors.map((mentor) => {
            const isOwnCard = ownMentorMemberId === mentor.memberId;
            return (
              <ScrollRevealItem key={mentor.memberId}><MentorshipCard
                avatar={mentor.avatarUrl}
                name={mentor.fullName ?? `Mentor #${mentor.memberId}`}
                role={
                  [mentor.currentJobTitle, mentor.currentCompany]
                    .filter(Boolean)
                    .join(' @ ') || t('mentorship:default_advisor_role')
                }
                rating={formatRating(mentor.ratingAvg)}
                reviews={mentor.totalSessions ?? 0}
                tags={(mentor.expertiseTopics ?? []).slice(0, 3)}
                onViewProfile={() => handleViewProfile(mentor.memberId)}
                onBook={() => handleBook(mentor.memberId)}
                canBook={access.canUseMentorship && access.hasJoinedMentorship && !isOwnCard}
                bookDisabledReason={isOwnCard ? t('mentorship:this_is_your_profile') : bookDisabledReason}
              /></ScrollRevealItem>
            );
          })}
        </ScrollRevealGroup>
      )}

      {paginated && paginated.totalPage > 1 && (
        <ScrollRevealItem sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            disabled={!paginated.hasPrevious}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            {t('mentorship:pagination_previous')}
          </Button>
          <Typography sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
            {paginated.currentPage + 1} / {paginated.totalPage}
          </Typography>
          <Button
            variant="outlined"
            disabled={!paginated.hasNext}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('mentorship:pagination_next')}
          </Button>
        </ScrollRevealItem>
      )}
    </ScrollRevealGroup>
  );
};

export default MentorshipMentorListSection;
