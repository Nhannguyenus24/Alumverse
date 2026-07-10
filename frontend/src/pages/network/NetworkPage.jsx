import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Card,
  Pagination,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';

import NetworkSectionLayout from '../../components/network/NetworkSectionLayout';
import AlumniContentLayout from '../../layouts/AlumniContentLayout';
import SearchBar from '../../components/SearchBar';
import NetworkSearchMemberCard from '../../components/network/NetworkSearchMemberCard';
import NetworkMessageDrawer from '../../components/network/NetworkMessageDrawer';
import ConfirmDialog from '../../components/ConfirmDialog';
import usePaginationScrollToTop from '../../hooks/usePaginationScrollToTop';
import DynamicFilterBar from '../../components/DynamicFilterBar';
import { useNetworkMembers } from '../../hooks/network/useNetworkMembers';
import { useCheckConversationRequestStatus } from '../../hooks/network/useCheckConversationRequestStatus';
import { useNetworkCurrentMemberId } from '../../hooks/network/useNetworkCurrentMemberId';
import { useBlockUser } from '../../hooks/network/useBlockUser';
import { useNotification } from '../../hooks/useNotification';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useAuth } from '../../hooks/useAuth';
import useOrganizationStore from '../../stores/organizationStore';
import { organizationApi } from '../../utils/api';
import { CONVERSATION_REQUEST_STATUS } from '../../constants/conversationRequestStatus';
import {
  getDefaultNetworkFilters,
  getNetworkGuestBenefits,
  getNetworkGuestStats,
  getNetworkGuestSteps,
  getNetworkSearchFilterConfig,
} from '../../constants/networkConfig';
import StatsBanner from '../../components/StatsBanner';
import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
} from '../../components/animations/ScrollReveal';

const PAGE_SIZE = 9;
const guestBenefitIcons = [
  GroupsOutlinedIcon,
  ChatBubbleOutlineOutlinedIcon,
  VerifiedUserOutlinedIcon,
];

const NetworkGuestLanding = () => {
  const { t } = useTranslation(['network', 'common']);
  const navigate = useOrgNavigate();
  const benefits = getNetworkGuestBenefits(t);

  return (
    <AlumniContentLayout
      variant="one"
      maxWidth="lg"
      pageTitle={t('network:title')}
      header={null}
      contentSpacing={0}
    >
      <ScrollRevealGroup stagger={0.09} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <ScrollRevealItem><Stack spacing={2}>
          <Typography
            variant="h1"
            fontWeight={800}
            color="primary.main"
            sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}
          >
            {t('network:page_heading')}
          </Typography>
          <Typography color="text.secondary">
            {t('network:page_subtitle')}
          </Typography>
        </Stack></ScrollRevealItem>

        <ScrollRevealItem
          sx={{
            borderRadius: 3,
            px: { xs: 3, md: 5 },
            py: { xs: 4, md: 5 },
            bgcolor: (theme) => theme.palette.mode === 'dark'
              ? alpha(theme.palette.primary.main, 0.18)
              : 'primary.lighter',
            color: (theme) => theme.palette.mode === 'dark' ? 'common.white' : 'text.primary',
            border: '1px solid',
            borderColor: (theme) => theme.palette.mode === 'dark'
              ? alpha(theme.palette.primary.main, 0.32)
              : alpha(theme.palette.primary.main, 0.2),
            boxShadow: (theme) => theme.palette.mode === 'dark'
              ? `0 0 34px ${alpha(theme.palette.primary.main, 0.16)}`
              : 'none',
          }}
        >
          <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 2 }}>
            {t('network:guest_overline')}
          </Typography>
          <Typography
            variant="h3"
            fontWeight={800}
            color="primary.main"
            sx={{ mt: 1, mb: 2, fontSize: { xs: '1.75rem', md: '2.25rem' } }}
          >
            {t('network:guest_headline')}
          </Typography>
          <Typography sx={{ opacity: 0.92, maxWidth: 840, mb: 3, lineHeight: 1.7 }}>
            {t('network:guest_desc')}
          </Typography>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Button variant="contained" color="primary" onClick={() => navigate('/auth/login')}>
              {t('network:guest_login')}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate('/auth/register')}
            >
              {t('network:guest_register')}
            </Button>
          </Stack>
        </ScrollRevealItem>

        <ScrollRevealItem><StatsBanner items={getNetworkGuestStats(t)} /></ScrollRevealItem>

        <ScrollRevealItem>
          <Typography variant="h4" fontWeight={700} mb={3}>
            {t('network:guest_benefits_heading')}
          </Typography>
          <ScrollRevealGroup stagger={0.08}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
              gap: 2,
            }}
          >
            {benefits.map((item, index) => {
              const Icon = guestBenefitIcons[index] ?? GroupsOutlinedIcon;
              return (
                <ScrollRevealItem key={item.title}><Card sx={{ p: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                  <Icon sx={{ fontSize: 40, color: 'primary.main', mb: 1.5 }} />
                  <Typography fontWeight={700} mb={1}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </Card></ScrollRevealItem>
              );
            })}
          </ScrollRevealGroup>
        </ScrollRevealItem>

        <ScrollRevealItem>
          <Typography variant="h4" fontWeight={700} mb={3}>
            {t('network:guest_steps_heading')}
          </Typography>
          <ScrollRevealGroup stagger={0.08} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {getNetworkGuestSteps(t).map((item) => (
              <ScrollRevealItem key={item.step}><Card
                sx={{
                  p: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  gap: 2,
                  alignItems: 'flex-start',
                }}
                elevation={0}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'common.white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {item.step}
                </Box>
                <Box>
                  <Typography fontWeight={700}>{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.text}
                  </Typography>
                </Box>
              </Card></ScrollRevealItem>
            ))}
          </ScrollRevealGroup>
        </ScrollRevealItem>

        <ScrollRevealItem><Card
          sx={{
            p: { xs: 3, md: 4 },
            textAlign: 'center',
            border: '1px dashed',
            borderColor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.36 : 0.24),
            bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.06),
          }}
          elevation={0}
        >
          <Typography variant="h5" fontWeight={700} mb={1}>
            {t('network:guest_cta_heading')}
          </Typography>
          <Typography color="text.secondary" mb={3} maxWidth={520} mx="auto">
            {t('network:guest_cta_desc')}
          </Typography>
          <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap" useFlexGap>
            <Button variant="contained" color="primary" onClick={() => navigate('/auth/login')}>
              {t('network:guest_login')}
            </Button>
            <Button variant="outlined" color="primary" onClick={() => navigate('/auth/register')}>
              {t('network:guest_register')}
            </Button>
          </Stack>
        </Card></ScrollRevealItem>
      </ScrollRevealGroup>
    </AlumniContentLayout>
  );
};

const NetworkMemberDirectory = () => {
  const { t } = useTranslation(['network', 'common']);
  const [searchInput, setSearchInput] = useState('');
  const [appliedFullName, setAppliedFullName] = useState('');
  const [page, setPage] = useState(1);
  // Default to the current member's own organization (guaranteed loaded by
  // RequireSlugRoute before this page mounts). Users broaden via the filter
  // bar — pick more orgs, or "Tất cả" to see every organization.
  const [filters, setFilters] = useState(() => {
    const currentOrgId = useOrganizationStore.getState().organization?.id;
    return getDefaultNetworkFilters(currentOrgId);
  });
  const [messagePeer, setMessagePeer] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isMessageDrawerOpen, setIsMessageDrawerOpen] = useState(false);
  const [checkingUserId, setCheckingUserId] = useState(null);
  const [blockTarget, setBlockTarget] = useState(null);

  const navigate = useOrgNavigate();
  const currentMemberId = useNetworkCurrentMemberId();

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations', 'all'],
    queryFn: () => organizationApi.getAllOrganizations(),
    staleTime: 5 * 60 * 1000,
  });

  const filterConfig = useMemo(
    () => getNetworkSearchFilterConfig(t, organizations),
    [t, organizations],
  );

  const { showError, showInfo } = useNotification();
  const { checkStatus } = useCheckConversationRequestStatus();
  const { blockUser, isBlocking } = useBlockUser({
    targetMemberId: blockTarget?.userId ?? null,
    onSuccess: () => setBlockTarget(null),
  });

  const { items, totalPage, isPending, isFetching, isError, errorMessage } = useNetworkMembers({
    appliedFullName,
    filters,
    page,
    pageSize: PAGE_SIZE,
  });

  const pageCount = totalPage > 0 ? totalPage : 0;
  const safePage = pageCount === 0 ? 1 : Math.min(page, pageCount);

  useEffect(() => {
    if (pageCount === 0) return;
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [pageCount, page]);

  const handlePageChange = usePaginationScrollToTop({ currentPage: safePage, setPage });

  const handleSearchKeyDown = useCallback((event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    setAppliedFullName(searchInput.trim());
    setPage(1);
  }, [searchInput]);

  const handleFilterChange = useCallback((next) => {
    setFilters(next);
    setPage(1);
  }, []);

  const hasActiveCriteria = Boolean(appliedFullName) || !filters.all;
  const showEmptyState = !isPending && !isFetching && items.length === 0;

  const handleOpenMessage = useCallback(
    async (member) => {
      if (String(member.userId) === String(currentMemberId)) {
        showInfo(t('network:self_profile_message'));
        return;
      }

      setCheckingUserId(member.userId);

      try {
        const result = await checkStatus(member.userId);
        if (result?.status === CONVERSATION_REQUEST_STATUS.ACCEPTED) {
          navigate(`/chat?memberId=${member.userId}`);
          return;
        }

        setMessagePeer({
          userId: member.userId,
          fullName: member.fullName,
          avatarUrl: member.avatarUrl,
          program: member.program,
          major: member.major,
        });
        setConnectionStatus(result);
        setIsMessageDrawerOpen(true);
      } catch {
        showError(t('network:check_connection_error'));
      } finally {
        setCheckingUserId(null);
      }
    },
    [checkStatus, currentMemberId, navigate, showError, showInfo, t],
  );

  const handleCloseMessage = useCallback(() => {
    setIsMessageDrawerOpen(false);
    setConnectionStatus(null);
  }, []);

  return (
    <NetworkSectionLayout title={t('network:title')}>
      <ScrollRevealGroup stagger={0.08} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <ScrollRevealItem><Typography
          variant="h1"
          fontWeight={800}
          color="primary.main"
          sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}
        >
          {t('network:page_heading')}
        </Typography></ScrollRevealItem>

        <ScrollRevealItem><Typography color="text.secondary">
          {t('network:page_subtitle')}
        </Typography></ScrollRevealItem>

        <ScrollRevealItem><DynamicFilterBar
          config={filterConfig}
          value={filters}
          onChange={handleFilterChange}
        /></ScrollRevealItem>

        <ScrollRevealItem><SearchBar
          value={searchInput}
          onChange={setSearchInput}
          onKeyDown={handleSearchKeyDown}
          placeholder={t('network:search_by_name_placeholder')}
        /></ScrollRevealItem>
      </ScrollRevealGroup>

      {isError ? <Alert severity="error">{errorMessage}</Alert> : null}

      {isPending ? (
        <Stack alignItems="center" py={6}>
          <CircularProgress color="primary" />
        </Stack>
      ) : showEmptyState ? (
        <Alert severity="info">
          {hasActiveCriteria
            ? t('network:no_filter_results')
            : t('network:no_members_to_show')}
        </Alert>
      ) : items.length > 0 ? (
        <ScrollRevealGroup
          stagger={0.07}
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: '1fr 1fr 1fr',
            },
            gap: 3,
            alignItems: 'stretch',
            opacity: isFetching ? 0.6 : 1,
            transition: 'opacity 0.2s',
            '& > *': {
              minWidth: 0,
            },
          }}
        >
          {items.map((member) => {
            const isSelf = String(member.userId) === String(currentMemberId);
            const isConnected =
              member.connectionStatus === CONVERSATION_REQUEST_STATUS.ACCEPTED;
            const isPending =
              member.connectionStatus === CONVERSATION_REQUEST_STATUS.PENDING;

            const messageButtonLabel = isSelf
              ? t('network:this_is_you')
              : isConnected
                ? t('network:message')
                : isPending
                  ? t('network:connect_pending')
                  : t('network:connect');

            return (
              <ScrollRevealItem key={member.userId} sx={{ display: 'flex', width: '100%', minWidth: 0, height: '100%' }}>
                <NetworkSearchMemberCard
                  userId={member.userId}
                  avatar={member.avatarUrl}
                  fullName={member.fullName}
                  program={member.program}
                  major={member.major}
                  onMessage={isSelf ? null : () => handleOpenMessage(member)}
                  onBlock={isSelf ? null : () => setBlockTarget(member)}
                  isMessageLoading={checkingUserId === member.userId}
                  isBlockLoading={isBlocking && blockTarget?.userId === member.userId}
                  messageButtonLabel={messageButtonLabel}
                  messageButtonVariant={isConnected ? 'outlined' : 'contained'}
                />
              </ScrollRevealItem>
            );
          })}
        </ScrollRevealGroup>
      ) : null}

      {pageCount > 0 ? (
        <ScrollReveal><Stack direction="row" justifyContent="center" alignItems="center">
          <Pagination
            count={pageCount}
            page={safePage}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            size="large"
            disabled={isFetching}
            sx={{
              '& .MuiPaginationItem-root': {
                fontWeight: 700,
                minWidth: 38,
                height: 38,
              },
            }}
          />
        </Stack></ScrollReveal>
      ) : null}

      <NetworkMessageDrawer
        open={isMessageDrawerOpen}
        onClose={handleCloseMessage}
        peer={messagePeer}
        connectionStatus={connectionStatus}
      />

      <ConfirmDialog
        open={Boolean(blockTarget)}
        title={t('network:block_user_title')}
        message={(
          <>
            {`${t('network:block_user_confirm_message', { name: blockTarget?.fullName ?? t('network:this_user') })} `}
            <Typography component="strong" variant="inherit" sx={{ color: 'text.primary', fontWeight: 700 }}>
              {t('network:block_user_note')}
            </Typography>
            {` ${t('network:block_user_consequence')}`}
          </>
        )}
        confirmText={t('network:block')}
        cancelText={t('common:cancel')}
        confirmColor="primary"
        loading={isBlocking}
        onConfirm={() => blockUser()}
        onCancel={() => setBlockTarget(null)}
      />
    </NetworkSectionLayout>
  );
};

const NetworkPage = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <AlumniContentLayout variant="one" maxWidth="lg" pageTitle="Network" header={null}>
        <Stack alignItems="center" py={6}>
          <CircularProgress color="primary" />
        </Stack>
      </AlumniContentLayout>
    );
  }

  return isAuthenticated ? <NetworkMemberDirectory /> : <NetworkGuestLanding />;
};

export default NetworkPage;
