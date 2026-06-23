import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { Box, Button, Container, InputAdornment, Stack, TextField, Tooltip, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import Page from '../../components/Page';
import ForumFilterPanel from '../../components/forum/ForumFilterPanel';
import ForumSponsoredCard from '../../components/forum/ForumSponsoredCard';
import Breadcrumb from '../../components/Breadcrumb';
import { useAuth } from '../../hooks/useAuth';
import { useOrganization } from '../../hooks/useOrganization';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useForumCategories } from '../../hooks/forum/useForumCategories';
import { useForumTopics } from '../../hooks/forum/useForumTopics';
import { useNotification } from '../../hooks/useNotification';
import { formatRelativeTimeVi } from '../../utils/dateFormatter';
import { useDebounce } from '../../hooks/useDebounce';

const CAREER_CATEGORY_ID = 1;

const ForumAlumniCareerPage = () => {
  const { t } = useTranslation(['forum', 'common']);
  const navigate = useOrgNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { organization } = useOrganization();
  const { showError } = useNotification();
  const [searchKeyword, setSearchKeyword] = useState('');
  const debouncedKeyword = useDebounce(searchKeyword, 500);
  const hasShownTopicsErrorRef = useRef(false);
  const organizationId = organization?.id ?? null;
  const { categories } = useForumCategories(organizationId);

  const filters = useMemo(() => {
    if (!categories?.length) {
      return [{ id: 'all', label: t('common:all') }];
    }
    const parentCategories = categories
      .filter((c) => c.parentId == null)
      .slice()
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
    return [
      { id: 'all', label: t('common:all') },
      ...parentCategories.map((c) => ({ id: `parent-${c.id}`, label: c.name })),
    ];
  }, [categories, t]);

  const selectedSidebarId = useMemo(() => {
    const sid = location.state?.selectedFilterId;
    if (sid === 'all' || (typeof sid === 'string' && sid.startsWith('parent-'))) {
      return sid;
    }
    return 'all';
  }, [location.state?.selectedFilterId]);

  const { topics, isPending, isError } = useForumTopics(CAREER_CATEGORY_ID, debouncedKeyword, 0, 20);

  useEffect(() => {
    if (isError) {
      if (!hasShownTopicsErrorRef.current) {
        showError(t('forum:error_loading_topics'));
        hasShownTopicsErrorRef.current = true;
      }
      return;
    }
    hasShownTopicsErrorRef.current = false;
  }, [isError, showError, t]);

  const handleFilterChange = useCallback(
    (id) => {
      if (id === 'all') {
        navigate('/forum');
        return;
      }
      if (typeof id === 'string' && id.startsWith('parent-')) {
        navigate('/forum', { state: { selectedFilterId: id } });
        return;
      }
    },
    [navigate]
  );

  return (
    <Page
      title={t('forum:page_title_alumni_career')}
      meta={<meta name="description" content={t('forum:page_meta_alumni_career')} />}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{ pb: { xs: 4, md: 6 }, overflowX: 'hidden' }}
      >
        <Container maxWidth="xl" sx={{ pt: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, lg: 6 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'flex-start',
              gap: { xs: 2, md: 3 },
            }}
          >
            <Stack spacing={2} sx={{ width: { xs: '100%', md: 260 }, flexShrink: 0 }}>
              <ForumFilterPanel
                filters={filters}
                selectedId={selectedSidebarId}
                onChange={handleFilterChange}
              />
              <ForumSponsoredCard
                title="Sponsored"
                imageSrc="/forum/metro_station.png"
                imageAlt="HCMC Metro Opening"
                caption="HCMC Metro Opening"
              />
            </Stack>

            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                backgroundColor: '#fff',
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Box
                sx={{
                  px: { xs: 1.5, sm: 2, md: 3 },
                  py: { xs: 1.5, md: 2 },
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <Breadcrumb
                  items={[
                    { label: t('forum:alumni_career_breadcrumb'), path: '/forum/alumni/career' },
                    { label: t('forum:alumni_career_breadcrumb_sub') },
                  ]}
                  uppercase
                  color="primary"
                />
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
                >
                  <Typography
                    variant="h4"
                    component="h1"
                    fontWeight={800}
                    color="primary.main"
                    sx={{
                      fontSize: { xs: '1.35rem', sm: '1.5rem', md: '1.75rem' },
                      wordBreak: 'break-word',
                    }}
                  >
                    {t('forum:alumni_career_title')}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: 'center',
                      gap: 2,
                      width: { xs: '100%', sm: 'auto' },
                    }}
                  >
                    <TextField
                      size="small"
                      placeholder={t('forum:search_topic_placeholder')}
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      sx={{ width: { xs: '100%', sm: 260 } }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Tooltip title={!isAuthenticated ? t('forum:login_required_to_post') : ''} arrow>
                      <span>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => navigate('/forum/alumni/career/create-topic')}
                          disabled={!isAuthenticated}
                          sx={{ minWidth: { xs: '100%', sm: 'auto' }, height: 40 }}
                        >
                          {t('forum:create_post')}
                        </Button>
                      </span>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>

              <Box>
                {isPending && !topics.length && (
                  <Box
                    sx={{
                      px: { xs: 1.5, sm: 2, md: 3 },
                      py: { xs: 1.5, md: 2 },
                      borderTop: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Typography color="text.secondary">{t('forum:loading_topics')}</Typography>
                  </Box>
                )}
                {isError && !isPending && !topics.length && (
                  <Box
                    sx={{
                      px: { xs: 1.5, sm: 2, md: 3 },
                      py: { xs: 1.5, md: 2 },
                      borderTop: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Typography color="text.secondary">{t('forum:error_loading_topics')}</Typography>
                  </Box>
                )}
                {!isPending && !isError && topics.length === 0 && (
                  <Box
                    sx={{
                      px: { xs: 1.5, sm: 2, md: 3 },
                      py: { xs: 4, md: 6 },
                      borderTop: 1,
                      borderColor: 'divider',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                      {debouncedKeyword
                        ? t('forum:no_topics_for_keyword', { keyword: debouncedKeyword })
                        : t('forum:no_topics_in_category')}
                    </Typography>
                  </Box>
                )}
                {topics.map((topic) => (
                  <Box
                    key={topic.id}
                    onClick={() =>
                      navigate(`/forum/alumni/career/${topic.id}`, {
                        state: {
                          topicTitle: topic.title,
                          topicSummary: {
                            id: topic.id,
                            title: topic.title,
                            createdByMemberId: topic.createdByMemberId ?? null,
                            createdAt: topic.createdAt ?? null,
                            viewCount: topic.viewCount ?? null,
                            categoryId: topic.categoryId ?? null,
                          },
                          selectedFilterId: 'alumni',
                        },
                      })
                    }
                    sx={{
                      px: { xs: 1.5, sm: 2, md: 3 },
                      py: { xs: 1.5, md: 2 },
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      alignItems: { xs: 'flex-start', md: 'center' },
                      gap: { xs: 1.5, md: 3 },
                      borderTop: 1,
                      borderColor: 'divider',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          position: 'relative',
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight={700}>A</Typography>
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: -1,
                            right: -1,
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: '#2ECC71',
                            border: '2px solid #fff',
                          }}
                        />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="subtitle1"
                          fontWeight={600}
                          sx={{
                            fontSize: { xs: '0.95rem', md: '1rem' },
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {topic.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {`${t('forum:member_prefix')}${topic.createdByMemberId ?? '—'}`} • {formatRelativeTimeVi(topic.createdAt)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: { xs: 2, md: 3 },
                        ml: { md: 'auto' },
                        flexShrink: 0,
                      }}
                    >
                      <Box sx={{ textAlign: 'center', minWidth: { xs: 56, sm: 72 } }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {t('forum:views')}
                        </Typography>
                        <Typography variant="body2" fontWeight={800}>{topic.viewCount ?? 0}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', minWidth: { xs: 56, sm: 72 } }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {t('forum:discussions')}
                        </Typography>
                        <Typography variant="body2" fontWeight={800}>—</Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          minWidth: { xs: 120, sm: 160 },
                          justifyContent: 'flex-end',
                        }}
                      >
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <PersonIcon sx={{ fontSize: 18 }} />
                        </Box>
                        <Box sx={{ textAlign: 'left' }}>
                          <Typography variant="body2" fontWeight={600}>
                            {`${t('forum:member_prefix')}${topic.createdByMemberId ?? '—'}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatRelativeTimeVi(topic.updatedAt ?? topic.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Container>
      </Container>
    </Page>
  );
};

export default ForumAlumniCareerPage;
