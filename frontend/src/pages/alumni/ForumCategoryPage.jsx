import {
  Box,
  Button,
  Container,
  InputAdornment,
  MenuItem,
  Pagination,
  Stack,
  TextField,
  Typography,
  Tooltip,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import AddCommentOutlinedIcon from "@mui/icons-material/AddCommentOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import Page from "../../components/Page";
import Breadcrumb from "../../components/Breadcrumb";
import ForumFilterPanel from "../../components/forum/ForumFilterPanel";
import ForumTopicListItem from "../../components/forum/ForumTopicListItem";
import AlumniContentLayout from "../../layouts/AlumniContentLayout";

import { useOrganization } from "../../hooks/useOrganization";
import {
  useForumCategoryLogic,
  FORUM_TOPIC_SORT_OPTIONS,
} from "../../hooks/forum/useForumCategoryLogic";
import { useCanContribute } from "../../hooks/useCanContribute";
import { useOrgPath } from "../../hooks/useOrgNavigate";
import {
  ScrollReveal,
  getStaggerDelay,
} from "../../components/animations/ScrollReveal";

const ForumCategoryPage = () => {
  const { t } = useTranslation(["forum", "common"]);
  const { canContribute, isAuthenticated } = useCanContribute();
  const { organization } = useOrganization();
  const organizationId = organization?.id ?? null;

  const {
    categoryId,
    topics,
    topicsPending,
    filters,
    activeCategory,
    selectedSidebarId,
    breadcrumbItems,
    pageTitle,
    handleFilterChange,
    navigate,
    searchKeyword,
    setSearchKeyword,
    debouncedKeyword,
    sortBy,
    setSortBy,
    page,
    setPage,
    pageInfo,
  } = useForumCategoryLogic(organizationId);

  const toOrgPath = useOrgPath();
  const handleAuthorClick = (memberId) => {
    if (!memberId) return;
    const url = `${window.location.origin}${toOrgPath(`/profile/${memberId}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleTopicClick = (topic) => {
    navigate(`/forum/topic/${topic.id}`, {
      state: {
        topicTitle: topic.title,
        topicSummary: {
          id: topic.id,
          title: topic.title,
          createdByMemberId: topic.createdByMemberId ?? null,
          authorName: topic.authorName ?? null,
          authorAvatarUrl: topic.authorAvatarUrl ?? null,
          createdAt: topic.createdAt ?? null,
          viewCount: topic.viewCount ?? null,
          categoryId: topic.categoryId ?? null,
        },
        selectedFilterId:
          activeCategory?.parentId != null
            ? `parent-${activeCategory.parentId}`
            : `parent-${categoryId}`,
      },
    });
  };

  if (categoryId == null) {
    return (
      <Page
        title={t("common:not_found")}
        meta={<meta name="description" content={t("forum:invalid_category")} />}
      >
        <Container sx={{ py: 4 }}>
          <Typography color="text.secondary">
            {t("forum:invalid_category")}
          </Typography>
          <Button
            sx={{ mt: 2 }}
            onClick={() => navigate("/forum")}
            variant="contained"
          >
            {t("forum:back_to_forum")}
          </Button>
        </Container>
      </Page>
    );
  }

  return (
    <AlumniContentLayout
      variant="forum"
      pageTitle={pageTitle}
      meta={
        <meta
          name="description"
          content={t("forum:topics_in_category", {
            name: activeCategory?.name ?? t("forum:category"),
          })}
        />
      }
      sidebar={
        <ForumFilterPanel
          filters={filters}
          selectedId={selectedSidebarId}
          onChange={handleFilterChange}
        />
      }
      header={null}
      contentSpacing={0}
    >
      <Stack
        spacing={0}
        sx={{
          flex: 1,
          minWidth: 0,
          width: "100%",
          px: { xs: 0, sm: 2, md: 2.75 },
        }}
      >
        <ScrollReveal>
          <Breadcrumb items={breadcrumbItems} uppercase color="primary" />
        </ScrollReveal>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            backgroundColor: "background.paper",
            border: 1,
            borderColor: "divider",
          }}
        >
          <ScrollReveal
            sx={{
              px: { xs: 1.5, sm: 2, md: 3 },
              py: { xs: 1.5, md: 2 },
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "flex-start", sm: "center" },
                justifyContent: "space-between",
                gap: 2,
                mt: 1,
              }}
            >
              <Typography
                variant="h4"
                component="h1"
                fontWeight={800}
                color="primary.main"
                sx={{
                  fontSize: { xs: "1.35rem", sm: "1.5rem", md: "1.75rem" },
                  wordBreak: "break-word",
                }}
              >
                {(activeCategory?.name ?? t("forum:category")).toUpperCase()}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 1,
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                <Tooltip
                  title={
                    canContribute
                      ? ""
                      : !isAuthenticated
                        ? t("common:verification_required_login")
                        : t("common:verification_required_tooltip")
                  }
                  placement="top"
                  arrow
                >
                  <span>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={
                        <AddCommentOutlinedIcon sx={{ fontSize: 18 }} />
                      }
                      onClick={() =>
                        navigate("/forum/topic/create-topic", {
                          state: {
                            categoryId: activeCategory?.id,
                            parentId: activeCategory?.parentId,
                          },
                        })
                      }
                      sx={{ minWidth: { xs: "100%", sm: "auto" } }}
                      disabled={!canContribute}
                    >
                      {t("create_post")}
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          </ScrollReveal>

          <ScrollReveal
            sx={{
              px: { xs: 1.5, sm: 2, md: 3 },
              py: { xs: 1.5, md: 2 },
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 1.5,
                alignItems: { xs: "stretch", sm: "center" },
              }}
            >
              <TextField
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder={t("search_topic_placeholder")}
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon sx={{ fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ flex: 1 }}
              />
              <TextField
                select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                size="small"
                label={t("sort_by")}
                sx={{ minWidth: { xs: "100%", sm: 200 } }}
              >
                <MenuItem value={FORUM_TOPIC_SORT_OPTIONS.NEWEST}>
                  {t("sort_newest")}
                </MenuItem>
                <MenuItem value={FORUM_TOPIC_SORT_OPTIONS.MOST_VIEWED}>
                  {t("sort_most_viewed")}
                </MenuItem>
              </TextField>
            </Box>
          </ScrollReveal>

          <Box>
            {topicsPending && !topics?.length ? (
              <Box sx={{ px: 3, py: 4 }}>
                <Typography color="text.secondary">
                  {t("common:loading")}
                </Typography>
              </Box>
            ) : !topics?.length ? (
              <Box sx={{ px: 3, py: 4 }}>
                <Typography color="text.secondary">
                  {debouncedKeyword
                    ? t("no_topics_for_keyword", { keyword: debouncedKeyword })
                    : t("no_topics_in_category")}
                </Typography>
              </Box>
            ) : (
              topics.map((topic, index) => (
                <ScrollReveal
                  key={topic.id}
                  delay={getStaggerDelay(index, 0.07)}
                >
                  <ForumTopicListItem
                    topic={topic}
                    activeCategory={activeCategory}
                    categoryId={categoryId}
                    onClick={handleTopicClick}
                    onAuthorClick={handleAuthorClick}
                  />
                </ScrollReveal>
              ))
            )}
          </Box>

          {(pageInfo?.totalPage ?? 0) > 1 && (
            <ScrollReveal
              sx={{
                display: "flex",
                justifyContent: "center",
                py: { xs: 2, md: 3 },
              }}
            >
              <Pagination
                color="primary"
                count={pageInfo.totalPage}
                page={page + 1}
                onChange={(_, value) => setPage(value - 1)}
              />
            </ScrollReveal>
          )}
        </Box>
      </Stack>
    </AlumniContentLayout>
  );
};

export default ForumCategoryPage;
