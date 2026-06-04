import { Box, Button, Container, Stack, Typography } from '@mui/material';
import Page from '../../components/Page';
import { useAuth } from '../../hooks/useAuth';
import { useOrganization } from '../../hooks/useOrganization';
import { useNotification } from '../../hooks/useNotification';
import ForumFilterPanel from '../../components/forum/ForumFilterPanel';
import ForumSponsoredCard from '../../components/forum/ForumSponsoredCard';
import ForumSection from '../../components/forum/ForumSection';

import { useForumPageLogic } from '../../hooks/forum/useForumPageLogic';
import { useForumManageMode } from '../../hooks/forum/useForumManageMode';
import ForumManageView from '../../components/forum/ForumManageView';

const ForumPage = () => {
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
    <Page
      title="Diễn đàn"
      meta={<meta name="description" content="Diễn đàn AlumVerse" />}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          pb: { xs: 4, md: 6 },
          overflowX: 'hidden',
        }}
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
              <ForumFilterPanel filters={filters} selectedId={selectedFilterId} onChange={handleFilterChange} />
              <ForumSponsoredCard
                title="Sponsored"
                imageSrc="/forum/metro_station.png"
                imageAlt="HCMC Metro Opening"
                caption="HCMC Metro Opening"
              />
            </Stack>

            <Stack
              spacing={3}
              sx={{
                flex: 1,
                minWidth: 0,
                width: '100%',
                px: { xs: 1.5, sm: 2, md: 2.75 },
              }}
            >
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
                  variant="h1"
                  component="h2"
                  fontWeight={800}
                  color="primary.main"
                  sx={{
                    fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                    letterSpacing: 1,
                  }}
                >
                  DIỄN ĐÀN
                </Typography>
                {isAdmin &&
                  (isManageMode ? (
                    <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                      <Button variant="outlined" color="primary" onClick={handleCloseManageMode}>
                        Huỷ
                      </Button>
                      <Button variant="contained" color="primary" onClick={handleSaveTopics}>
                        Lưu
                      </Button>
                    </Box>
                  ) : (
                    <Button
                      variant="outlined"
                      color="primary"
                      sx={{ flexShrink: 0 }}
                      onClick={handleOpenManageMode}
                    >
                      Thay đổi chủ đề
                    </Button>
                  ))}
              </Box>
              {isManageMode ? (
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
            </Stack>
          </Box>
        </Container>
      </Container>
    </Page>
  );
};

export default ForumPage;
