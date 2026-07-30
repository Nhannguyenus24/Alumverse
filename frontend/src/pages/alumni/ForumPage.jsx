import { Box, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { useOrganization } from "../../hooks/useOrganization";
import { useNotification } from "../../hooks/useNotification";
import { useCanContribute } from "../../hooks/useCanContribute";
import { useOrgNavigate, useOrgPath } from "../../hooks/useOrgNavigate";
import ForumFilterPanel from "../../components/forum/ForumFilterPanel";
import ForumSection from "../../components/forum/ForumSection";
import AlumniContentLayout from "../../layouts/AlumniContentLayout";

import { useForumPageLogic } from "../../hooks/forum/useForumPageLogic";
import { useForumManageMode } from "../../hooks/forum/useForumManageMode";
import ForumManageView from "../../components/forum/ForumManageView";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import { ScrollReveal } from "../../components/animations/ScrollReveal";

const ForumPage = () => {
  const { t } = useTranslation(["forum", "common"]);
  const { slug } = useParams();
  const navigate = useOrgNavigate();
  const adminBase = slug ? `/${slug}/admin` : "/admin";
  const { organization } = useOrganization();
  const notification = useNotification();
  const { isOrgManager } = useCanContribute();
  const isAdmin = isOrgManager;
  const toOrgPath = useOrgPath();

  const handleAuthorClick = (memberId) => {
    if (!memberId) return;
    const url = `${window.location.origin}${toOrgPath(`/profile/${memberId}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

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
    newMainTopicDesc,
    newSubTopics,
    newSubTopicDescs,
    setNewMainTopic,
    setNewMainTopicDesc,
    setNewSubTopics,
    setNewSubTopicDescs,
    handleOpenManageMode,
    handleCloseManageMode,
    handleAddMainTopic,
    handleAddSubTopic,
    handleDeleteTopic,
    handleDeleteBoard,
    handleSaveTopics,
    isSaving,
  } = useForumManageMode({ organizationId, visibleSections, ...notification });

  return (
    <AlumniContentLayout
      variant="forum"
      pageTitle={t("forum:page_title")}
      meta={
        <meta name="description" content={t("forum:page_meta_description")} />
      }
      sidebar={
        <ForumFilterPanel
          filters={filters}
          selectedId={selectedFilterId}
          onChange={handleFilterChange}
        />
      }
      contentSpacing={3}
    >
      <ScrollReveal
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Typography
          variant="h1"
          component="h2"
          fontWeight={800}
          color="primary.main"
          sx={{
            fontSize: { xs: "1.75rem", sm: "2rem", md: "2.25rem" },
            letterSpacing: 1,
          }}
        >
          {t("forum:forum_heading")}
        </Typography>
        {isAdmin &&
          (isManageMode ? (
            <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleCloseManageMode}
                disabled={isSaving}
              >
                {t("common:cancel")}
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveTopics}
                disabled={isSaving}
              >
                {isSaving
                  ? t("common:saving", { defaultValue: "Đang lưu..." })
                  : t("common:save")}
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: "flex", gap: 1, flexShrink: 0, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<TuneOutlinedIcon />}
                onClick={handleOpenManageMode}
              >
                {t("forum:manage_topics")}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AdminPanelSettingsOutlinedIcon />}
                onClick={() => navigate(`${adminBase}/forum/categories`)}
              >
                {t("forum:manage_forum", { defaultValue: "Quản lý diễn đàn" })}
              </Button>
            </Box>
          ))}
      </ScrollReveal>
      {isManageMode ? (
        <ScrollReveal>
          <ForumManageView
            manageTopics={manageTopics}
            newMainTopic={newMainTopic}
            newMainTopicDesc={newMainTopicDesc}
            setNewMainTopic={setNewMainTopic}
            setNewMainTopicDesc={setNewMainTopicDesc}
            handleAddMainTopic={handleAddMainTopic}
            newSubTopics={newSubTopics}
            newSubTopicDescs={newSubTopicDescs}
            setNewSubTopics={setNewSubTopics}
            setNewSubTopicDescs={setNewSubTopicDescs}
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
            onAuthorClick={handleAuthorClick}
          />
        ))
      )}
    </AlumniContentLayout>
  );
};

export default ForumPage;
