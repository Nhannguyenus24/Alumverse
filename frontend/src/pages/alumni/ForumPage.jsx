import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useOrganization } from '../../hooks/useOrganization';
import { useNotification } from '../../hooks/useNotification';

import { useForumPageLogic } from '../../hooks/forum/useForumPageLogic';
import { useForumManageMode } from '../../hooks/forum/useForumManageMode';

const ForumPage = () => {
  const { t } = useTranslation(['forum', 'common']);
  const { user } = useAuth();
  const { organization } = useOrganization();
  const notification = useNotification();
  const isAdmin = user?.role === 'ADMIN';

  const organizationId = organization?.id ?? null;

  const {
    filters,
    selectedFilterId,
    visibleSections,
    handleFilterChange,
    handleBoardClick,
    boardsForSection,
  } = useForumPageLogic(organizationId);

  const {
    isManageMode,
    manageTopics,
    newMainTopic,
    newSubTopics,
    setNewMainTopic,
    setNewSubTopics,
    handleOpenManageMode,
    handleCloseManageMode,
    handleAddMainTopic,
    handleAddSubTopic,
    handleDeleteTopic,
    handleDeleteBoard,
    handleSaveTopics,
  } = useForumManageMode({ visibleSections, ...notification });

  return (
    <AlumniContentLayout
      variant="forum"
      pageTitle={t('forum:page_title')}
      meta={<meta name="description" content={t('forum:page_meta_description')} />}
      sidebar={<ForumFilterPanel filters={filters} selectedId={selectedFilterId} onChange={handleFilterChange} />}
      contentSpacing={3}
    >
              <ScrollReveal
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Typography
                  variant="h1"
                  component="h2"
                  fontWeight={800}
                  color="primary.main"
                  sx={{
                    fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                    letterSpacing: 1,
                  }}
                >
                  {t('forum:forum_heading')}
                </Typography>
                {isAdmin &&
                  (isManageMode ? (
                    <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                      <Button variant="outlined" color="primary" onClick={handleCloseManageMode}>
                        {t('common:cancel')}
                      </Button>
                      <Button variant="contained" color="primary" onClick={handleSaveTopics}>
                        {t('common:save')}
                      </Button>
                    </Box>
                  ) : (
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<TuneOutlinedIcon />}
                      sx={{ flexShrink: 0 }}
                      onClick={handleOpenManageMode}
                    >
                      {t('forum:manage_topics')}
                    </Button>
                  ))}
              </ScrollReveal>
              {isManageMode ? (
                <ScrollReveal>
                  <ForumManageView
                    manageTopics={manageTopics}
                    newMainTopic={newMainTopic}
                    setNewMainTopic={setNewMainTopic}
                    handleAddMainTopic={handleAddMainTopic}
                    newSubTopics={newSubTopics}
                    setNewSubTopics={setNewSubTopics}
                    handleAddSubTopic={handleAddSubTopic}
                    handleDeleteTopic={handleDeleteTopic}
                    handleDeleteBoard={handleDeleteBoard}
                  />
                </ScrollReveal>
              ) : (
                visibleSections.map((section) => (
                  <ForumSection
                    key={section.id}
                    title={section.title}
                    boards={boardsForSection(section)}
                    onBoardClick={handleBoardClick}
                  />
                ))
              )}
    </AlumniContentLayout>
  );
};

export default ForumPage;
