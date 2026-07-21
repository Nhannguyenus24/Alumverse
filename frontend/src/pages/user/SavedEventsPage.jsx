import { useEffect, useState } from "react";
import { Box, Container } from "@mui/material";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import Page from "../../components/Page";
import SavedItemsHeader from "../../components/SavedItemsHeader";
import SavedItemList from "../../components/SavedItemList";
import { eventApi } from "../../utils/api";
import { normalizeEvent } from "../../hooks/articles/normalizeArticle";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";

const SavedEventsPage = () => {
  const { t } = useTranslation("article");
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useOrgNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const page = await eventApi.getMyInterestedEvents({ page: 0, limit: 50 });
      const events = page?.items ?? page?.content ?? page?.data ?? [];
      setItems(events.map(normalizeEvent));
    } catch {
      enqueueSnackbar(t("saved_load_error"), { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUnsave = async (eventId) => {
    try {
      await eventApi.removeInterest(eventId);
      setItems((list) => list.filter((e) => e.id !== eventId));
      enqueueSnackbar(t("saved_unsave_success"), { variant: "info" });
    } catch {
      enqueueSnackbar(t("saved_action_failed"), { variant: "error" });
    }
  };

  const rows = items.map((event) => ({
    key: event.id,
    title: event.title ?? t("saved_article_fallback_title", { id: event.id }),
    thumbnailUrl: event.thumbnailUrl,
    onOpen: () => navigate(`/article/event/${event.id}`),
    onUnsave: (e) => {
      e.stopPropagation();
      handleUnsave(event.id);
    },
  }));

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

export default SavedEventsPage;
