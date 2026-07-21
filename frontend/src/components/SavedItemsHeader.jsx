import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import TopTabFilter from "./mentorship/TopTabFilter";
import { ScrollReveal } from "./animations/ScrollReveal";
import { useOrgNavigate } from "../hooks/useOrgNavigate";

/** Shared "Quan tâm" heading + posts/events pill tabs, used by both saved-item pages. */
const SavedItemsHeader = () => {
  const { t } = useTranslation("article");
  const navigate = useOrgNavigate();

  const tabs = [
    { label: t("saved_tab_posts"), path: "/saved-articles" },
    { label: t("saved_tab_events"), path: "/saved-events" },
  ];

  return (
    <>
      <ScrollReveal>
        <Typography
          variant="h1"
          fontWeight={800}
          color="primary.main"
          sx={{ fontSize: { xs: "1.8rem", md: "2.3rem" }, mb: 3 }}
        >
          {t("interests").toUpperCase()}
        </Typography>
      </ScrollReveal>
      <ScrollReveal>
        <TopTabFilter tabs={tabs} onNavigate={navigate} />
      </ScrollReveal>
    </>
  );
};

export default SavedItemsHeader;
