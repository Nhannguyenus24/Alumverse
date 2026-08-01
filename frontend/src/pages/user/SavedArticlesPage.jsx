import { useEffect, useState } from "react";
import { Box, Container } from "@mui/material";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import Page from "../../components/Page";
import SavedItemsHeader from "../../components/SavedItemsHeader";
import SavedItemList from "../../components/SavedItemList";
import { savedItemApi } from "../../utils/api";
import apiClient from "../../utils/axios";
import { normalizeAlumniPost, normalizeNews, normalizeAchievement } from "../../hooks/articles/normalizeArticle";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";
import { useOrganization } from "../../hooks/useOrganization";

const orgParams = (organizationId) => (
  organizationId ? { params: { organizationId } } : undefined
);

/** itemType -> how to fetch + normalize + route to a saved post. */
const POST_CHANNELS = {
  NEWS: {
    fetch: (id, organizationId) => apiClient.get(`/articles/news/${id}`, orgParams(organizationId)),
    normalize: normalizeNews,
    articlePath: (id) => `/article/news/${id}`,
  },
  ALUMNI_POST: {
    fetch: (id, organizationId) => apiClient.get(`/articles/alumni-posts/${id}`, orgParams(organizationId)),
    normalize: normalizeAlumniPost,
    articlePath: (id) => `/article/alumni/${id}`,
  },
  ACHIEVEMENT: {
    fetch: (id, organizationId) => apiClient.get(`/articles/achievements/${id}`, orgParams(organizationId)),
    normalize: normalizeAchievement,
    articlePath: (id) => `/article/achievement/${id}`,
  },
};

const SavedArticlesPage = () => {
  const { t } = useTranslation("article");
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useOrgNavigate();
  const { organization, loading: organizationLoading } = useOrganization();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (organizationLoading) return;
    setLoading(true);
    try {
      const organizationId = organization?.id;
      const pages = await Promise.all(
        Object.keys(POST_CHANNELS).map((itemType) =>
          savedItemApi.listByType(itemType, { page: 0, limit: 50 })
        )
      );
      const saved = pages.flatMap((page) => page?.items ?? page?.content ?? page?.data ?? []);
      const resolved = await Promise.all(
        saved.map(async (s) => {
          const config = POST_CHANNELS[s.itemType];
          if (!config) return { ...s, article: null };
          try {
            const res = await config.fetch(s.itemId, organizationId);
            return { ...s, article: config.normalize(res?.data?.data ?? null) };
          } catch {
            return { ...s, article: null };
          }
        })
      );
      setItems(resolved);
    } catch {
      enqueueSnackbar(t("saved_load_error"), { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id, organizationLoading]);

  const handleUnsave = async (itemType, itemId) => {
    try {
      await savedItemApi.unsave(itemType, itemId);
      setItems((list) => list.filter((x) => !(x.itemType === itemType && x.itemId === itemId)));
      enqueueSnackbar(t("saved_unsave_success"), { variant: "info" });
    } catch {
      enqueueSnackbar(t("saved_action_failed"), { variant: "error" });
    }
  };

  const rows = items.map((s) => {
    const config = POST_CHANNELS[s.itemType];
    return {
      key: s.id ?? `${s.itemType}-${s.itemId}`,
      title: s.article?.title ?? t("saved_article_fallback_title", { id: s.itemId }),
      thumbnailUrl: s.article?.thumbnailUrl,
      onOpen: () => navigate(config ? config.articlePath(s.itemId) : `/article/news/${s.itemId}`),
      onUnsave: (e) => {
        e.stopPropagation();
        handleUnsave(s.itemType, s.itemId);
      },
    };
  });

  return (
    <Page title={t("interests")}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <SavedItemsHeader />
        <Box sx={{ mt: 3 }}>
          <SavedItemList items={rows} loading={loading} />
        </Box>
      </Container>
    </Page>
  );
};

export default SavedArticlesPage;
