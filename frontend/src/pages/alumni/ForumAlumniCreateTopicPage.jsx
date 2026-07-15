import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";

import {
  Alert,
  Box,
  Button,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import ForumFilterPanel from "../../components/forum/ForumFilterPanel";
import WYSIWYG from "../../components/WYSIWYG";
import AlumniContentLayout from "../../layouts/AlumniContentLayout";
import {
  ScrollRevealGroup,
  ScrollRevealItem,
} from "../../components/animations/ScrollReveal";
import { useAuth } from "../../hooks/useAuth";
import { useOrganization } from "../../hooks/useOrganization";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";
import { useForumCategories } from "../../hooks/forum/useForumCategories";
import { useCreateForumTopic } from "../../hooks/forum/useCreateForumTopic";
import { useCreateForumPost } from "../../hooks/forum/useCreateForumPost";
import { useNotification } from "../../hooks/useNotification";

const ForumAlumniCreateTopicPage = () => {
  const { t } = useTranslation(["forum", "common"]);
  const navigate = useOrgNavigate();
  const { user, verificationLevel } = useAuth();
  // Only org-verified alumni (verification level >= 2) may create alumni forum topics.
  const canPost = (verificationLevel ?? 0) >= 2;
  const { organization } = useOrganization();
  const organizationId = organization?.id ?? null;
  const {
    categories,
    isPending: categoriesPending,
    isError: categoriesIsError,
  } = useForumCategories(organizationId);
  const location = useLocation();
  const stateCategoryId = location.state?.categoryId;
  const stateParentId = location.state?.parentId;

  const [parentSubject, setParentSubject] = useState(
    stateParentId
      ? String(stateParentId)
      : stateCategoryId
        ? String(stateCategoryId)
        : "",
  );
  const [subSubject, setSubSubject] = useState(
    stateParentId ? String(stateCategoryId) : "",
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { showSuccess, showError, showWarning } = useNotification();
  const categoriesErrorShownRef = useRef(false);
  const { createTopic, isPending: createTopicPending } = useCreateForumTopic();
  const { createPost } = useCreateForumPost();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (categoriesIsError) {
      if (!categoriesErrorShownRef.current) {
        showError(t("forum:error_load_sub_topics"));
        categoriesErrorShownRef.current = true;
      }
      return;
    }
    categoriesErrorShownRef.current = false;
  }, [categoriesIsError, showError, t]);

  const filters = useMemo(() => {
    if (!categories?.length) {
      return [{ id: "all", label: t("common:all") }];
    }
    return [
      { id: "all", label: t("common:all") },
      ...categories.map((c) => ({ id: `category-${c.id}`, label: c.name })),
    ];
  }, [categories, t]);

  const parentSubjectOptions = useMemo(
    () =>
      (categories ?? [])
        .filter((category) => category.parentId == null)
        .map((category) => ({
          value: String(category.id),
          label: category.name,
        })),
    [categories],
  );

  const resolvedParentSubject =
    parentSubjectOptions.length === 0 ||
    parentSubjectOptions.some((opt) => opt.value === parentSubject)
      ? parentSubject
      : (parentSubjectOptions[0]?.value ?? "");

  const subSubjectOptions = (categories ?? [])
    .filter(
      (category) => String(category.parentId ?? "") === resolvedParentSubject,
    )
    .map((category) => ({
      value: String(category.id),
      label: category.name,
    }));

  useEffect(() => {
    if (resolvedParentSubject !== parentSubject) {
      setParentSubject(resolvedParentSubject);
    }
  }, [parentSubject, resolvedParentSubject]);

  const hasSelectedSubSubject =
    subSubjectOptions.length === 0 ||
    subSubjectOptions.some((opt) => opt.value === subSubject);
  const selectedSubSubject = hasSelectedSubSubject
    ? subSubject
    : (subSubjectOptions[0]?.value ?? "");

  useEffect(() => {
    if (selectedSubSubject !== subSubject) {
      setSubSubject(selectedSubSubject);
    }
  }, [selectedSubSubject, subSubject]);

  const selectedSidebarFilterId = filters.some(
    (f) => f.id === `category-${selectedSubSubject}`,
  )
    ? `category-${selectedSubSubject}`
    : "all";

  const handleFilterChange = useCallback(
    (id) => {
      if (id === "all") {
        navigate("/forum");
        return;
      }
      if (id?.startsWith("category-")) {
        navigate("/forum", { state: { selectedFilterId: id } });
        return;
      }
    },
    [navigate],
  );

  const handleCancel = () => {
    navigate("/forum");
  };

  const handleSubmit = async () => {
    const trimmedTitle = (title ?? "").trim();
    const plainOpeningContent = (content ?? "")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
    const categoryId = parseInt(selectedSubSubject, 10);
    if (!trimmedTitle) {
      showWarning(t("forum:warn_enter_title"));
      return;
    }
    if (!user?.id) {
      showError(t("forum:error_unknown_author"));
      return;
    }
    if (!canPost) {
      showWarning(t("forum:warn_alumni_verification_required"));
      return;
    }
    if (Number.isNaN(categoryId) || categoryId <= 0) {
      showWarning(t("forum:warn_select_valid_sub_topic"));
      return;
    }
    if (!organizationId) {
      showWarning(t("forum:warn_unknown_org"));
      return;
    }

    const payload = {
      organizationId,
      title: trimmedTitle,
      createdByMemberId: user.id,
      categoryId,
    };

    setIsSubmitting(true);
    let createdTopic = null;
    let openingPostError = null;
    try {
      createdTopic = await createTopic(payload);
      if (!createdTopic?.id) {
        showError(t("forum:error_create_topic_failed"));
        return;
      }
      if (plainOpeningContent) {
        try {
          await createPost({
            topicId: createdTopic.id,
            authorMemberId: user.id,
            content,
            answerToPostId: null,
          });
        } catch (postErr) {
          openingPostError =
            postErr?.response?.data?.message ??
            postErr?.message ??
            t("forum:opening_post_error_prefix");
        }
      }
      showSuccess(t("forum:success_create_topic"));
      if (openingPostError) {
        showWarning(
          `${t("forum:opening_post_error_prefix")} ${openingPostError}`,
        );
      }
      navigate("/forum", {
        state: {
          ...(openingPostError ? { openingPostError } : {}),
        },
      });
    } catch (topicErr) {
      const backendMessage = topicErr?.response?.data?.message;
      const backendValidationErrors = topicErr?.response?.data?.data;
      const firstValidationError =
        backendValidationErrors && typeof backendValidationErrors === "object"
          ? Object.values(backendValidationErrors)[0]
          : null;

      const message =
        backendMessage === "Validation failed" && firstValidationError
          ? firstValidationError
          : (backendMessage ??
            topicErr?.message ??
            t("forum:error_create_topic_failed"));
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlumniContentLayout
      variant="forum"
      pageTitle={t("forum:page_title_create_topic")}
      meta={
        <meta name="description" content={t("forum:page_meta_create_topic")} />
      }
      sidebar={
        <ForumFilterPanel
          filters={filters}
          selectedId={selectedSidebarFilterId}
          onChange={handleFilterChange}
        />
      }
      header={null}
      contentSpacing={0}
    >
      <ScrollRevealGroup stagger={0.08} sx={{ flex: 1, minWidth: 0 }}>
        <ScrollRevealItem>
          <Typography
            variant="h4"
            component="h1"
            fontWeight={800}
            color="primary.main"
            sx={{
              mb: 2.5,
              fontSize: { xs: "1.6rem", md: "1.9rem" },
              letterSpacing: 1,
            }}
          >
            {t("forum:create_topic_title")}
          </Typography>
        </ScrollRevealItem>

        {!canPost && (
          <ScrollRevealItem>
            <Alert severity="warning" sx={{ mb: 2.5 }}>
              {t("forum:warn_alumni_verification_required")}
            </Alert>
          </ScrollRevealItem>
        )}

        {/* Subject selectors */}
        <ScrollRevealItem
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1.5,
            mb: 2.5,
          }}
        >
          <TextField
            select
            fullWidth
            label={t("forum:parent_topic_label")}
            value={resolvedParentSubject}
            onChange={(e) => setParentSubject(e.target.value)}
            size="small"
            disabled={
              categoriesPending ||
              categoriesIsError ||
              !parentSubjectOptions.length
            }
          >
            {categoriesPending ? (
              <MenuItem value="" disabled>
                {t("forum:loading_parent_topics")}
              </MenuItem>
            ) : categoriesIsError ? (
              <MenuItem value="" disabled>
                {t("forum:error_loading_parent_topics")}
              </MenuItem>
            ) : !parentSubjectOptions.length ? (
              <MenuItem value="" disabled>
                {t("forum:no_parent_topics")}
              </MenuItem>
            ) : (
              parentSubjectOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))
            )}
          </TextField>

          <TextField
            select
            fullWidth
            label={t("forum:sub_topic_label")}
            value={selectedSubSubject}
            onChange={(e) => setSubSubject(e.target.value)}
            size="small"
            disabled={
              categoriesPending ||
              categoriesIsError ||
              !subSubjectOptions.length
            }
          >
            {categoriesPending ? (
              <MenuItem value="" disabled>
                {t("forum:loading_sub_topics")}
              </MenuItem>
            ) : categoriesIsError ? (
              <MenuItem value="" disabled>
                {t("forum:error_loading_sub_topics")}
              </MenuItem>
            ) : !resolvedParentSubject ? (
              <MenuItem value="" disabled>
                {t("forum:select_parent_topic_first")}
              </MenuItem>
            ) : !subSubjectOptions.length ? (
              <MenuItem value="" disabled>
                {t("forum:no_sub_topics")}
              </MenuItem>
            ) : (
              subSubjectOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))
            )}
          </TextField>
        </ScrollRevealItem>

        {/* Editor card */}
        <ScrollRevealItem
          sx={{
            border: 1,
            borderColor: "divider",
            backgroundColor: "background.paper",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "center", md: "stretch" },
            }}
          >
            {/* Title + editor */}
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{
                  px: { xs: 2, md: 2.5 },
                  py: 1.75,
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  label={t("forum:topic_title_label")}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("forum:topic_title_label")}
                  sx={{
                    "& .MuiInputBase-input": {
                      fontSize: { xs: "1.05rem", md: "1.1rem" },
                      fontWeight: 600,
                    },
                  }}
                />
              </Box>

              <Box sx={{ px: { xs: 2, md: 2.5 }, py: 2 }}>
                <WYSIWYG
                  value={content}
                  onChange={setContent}
                  placeholder={t("forum:topic_content_placeholder")}
                  height={320}
                />
              </Box>
            </Box>
          </Box>

          {/* Actions */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column-reverse", sm: "row" },
              justifyContent: "flex-end",
              gap: 1,
              px: { xs: 2, md: 2.5 },
              py: 1.5,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Button
              variant="outlined"
              color="inherit"
              onClick={handleCancel}
              disabled={isSubmitting}
              fullWidth={false}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              {t("forum:cancel")}
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                createTopicPending ||
                !user?.id ||
                !canPost ||
                !(title ?? "").trim() ||
                !selectedSubSubject
              }
              fullWidth={false}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              {isSubmitting || createTopicPending
                ? t("forum:creating_topic")
                : t("forum:create_topic_btn")}
            </Button>
          </Box>
        </ScrollRevealItem>
      </ScrollRevealGroup>
    </AlumniContentLayout>
  );
};

export default ForumAlumniCreateTopicPage;
