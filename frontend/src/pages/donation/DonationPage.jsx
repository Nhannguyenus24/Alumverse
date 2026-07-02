import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Box, Pagination, Stack, Typography } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import dayjs from "dayjs";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";
import usePaginationScrollToTop from "../../hooks/usePaginationScrollToTop";
import useOrganizationStore from "../../stores/organizationStore";
import { fundApi } from "../../utils/api";
import ArticleDonationCard from "../../components/articles/ArticleDonationCard";
import FeaturedArticleDonationCard from "../../components/articles/FeaturedArticleDonationCard";
import DonationCloseDialog from "../../components/donation/DonationCloseDialog";
import StatsBanner from "../../components/StatsBanner";
import AlumniContentLayout from "../../layouts/AlumniContentLayout";

const DEFAULT_ADMIN_STATS = { totalCurrentAmount: 0, totalFunds: 0, totalDonations: 0, totalDonationsAmountThisMonth: 0 };
const DEFAULT_FILTERS = { all: true, timeStartedFrom: "", timeStartedTo: "", trending: "", amountMin: "", amountMax: "" };

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value ?? 0));
}

function toIsoStartOfDay(value) {
  return dayjs(value).startOf("day").format("YYYY-MM-DDTHH:mm:ss");
}

function toIsoEndOfDay(value) {
  return dayjs(value).endOf("day").format("YYYY-MM-DDTHH:mm:ss");
}

export default function DonationPage() {
  const { t } = useTranslation(["donation", "common"]);
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user, isAuthenticated } = useAuth();
  const organizationId = useOrganizationStore((state) => state.organization?.id ?? null);
  const isAdmin = isAuthenticated && user?.role === "ADMIN";

  const [featuredCampaign, setFeaturedCampaign] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [closeDialogCampaign, setCloseDialogCampaign] = useState(null);
  const [isClosingFund, setIsClosingFund] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [adminStats, setAdminStats] = useState(DEFAULT_ADMIN_STATS);
  const warningSetRef = useRef(new Set());

  const gridPageSize = 4;
  const handlePageChange = usePaginationScrollToTop({ currentPage: page, setPage });

  const donationFilters = useMemo(() => [
    { type: "date", key: "timeStartedFrom", label: t("donation:filter_from_date") },
    { type: "date", key: "timeStartedTo", label: t("donation:filter_to_date") },
    { type: "dropdown", key: "trending", label: t("donation:filter_trending"), multiple: false, options: [{ value: "asc", label: t("common:oldest") }, { value: "desc", label: t("common:newest") }] },
    { type: "range-input", key: "amount", label: t("donation:filter_amount_range") },
  ], [t]);

  useEffect(() => {
    if (!isAdmin) return;
    let ignore = false;
    fundApi.getFundStatistics()
      .then((stats) => {
        if (ignore) return;
        setAdminStats({
          totalCurrentAmount: Number(stats?.totalCurrentAmount ?? 0),
          totalFunds: Number(stats?.totalFunds ?? 0),
          totalDonations: Number(stats?.totalDonations ?? 0),
          totalDonationsAmountThisMonth: Number(stats?.totalDonationsAmountThisMonth ?? 0),
        });
      })
      .catch((error) => {
        if (ignore) return;
        setAdminStats(DEFAULT_ADMIN_STATS);
        enqueueSnackbar(error?.response?.data?.message ?? t("donation:error_load_stats"), { variant: "error" });
      });
    return () => { ignore = true; };
  }, [enqueueSnackbar, isAdmin]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      let ignore = false;
      setIsLoading(true);
      setErrorMessage("");

      const params = {
        page: page - 1, limit: gridPageSize,
        organizationId: organizationId != null ? String(organizationId) : undefined,
        q: search.trim() || undefined,
        targetAmountMin: filters.amountMin || undefined, targetAmountMax: filters.amountMax || undefined,
        sortBy: filters.trending ? "donor_count" : undefined, direction: filters.trending || undefined,
        timeStartedFrom: filters.timeStartedFrom ? toIsoStartOfDay(filters.timeStartedFrom) : undefined,
        timeStartedTo: filters.timeStartedTo ? toIsoEndOfDay(filters.timeStartedTo) : undefined,
      };

      fundApi.getFunds(params)
        .then((payload) => {
          if (ignore) return;
          (payload?.warnings ?? []).forEach((warning) => {
            const key = String(warning);
            if (!warningSetRef.current.has(key)) {
              warningSetRef.current.add(key);
              enqueueSnackbar(key, { variant: "warning" });
            }
          });
          const pagedData = payload?.data;
          const items = pagedData?.items ?? [];

          if (page === 1) {
            if (items.length > 0) {
              setFeaturedCampaign(items[0]);
              setCampaigns(items.slice(1));
            } else {
              setFeaturedCampaign(null);
              setCampaigns([]);
            }
          } else {
            setCampaigns(items);
          }

          const totalItems = Number(pagedData?.totalItem ?? 0);
          const adjustedTotalItems = Math.max(totalItems - 1, 0);
          setPageCount(Math.max(1, Math.ceil(adjustedTotalItems / gridPageSize)));
        })
        .catch((error) => {
          if (ignore) return;
          setCampaigns([]);
          setPageCount(1);
          setErrorMessage(error?.response?.data?.message ?? t("donation:error_load_funds"));
        })
        .finally(() => { if (!ignore) setIsLoading(false); });

      return () => { ignore = true; };
    }, 300);
    return () => clearTimeout(debounce);
  }, [filters, search, enqueueSnackbar, organizationId, page, refreshToken]);

  const adminBannerItems = useMemo(() => [
    { value: `${formatCurrency(adminStats.totalCurrentAmount)} VND`, label: t("donation:stats_total_raised") },
    { value: formatCurrency(adminStats.totalFunds), label: t("donation:stats_open_funds") },
    { value: formatCurrency(adminStats.totalDonations), label: t("donation:stats_total_donations") },
    { value: `${formatCurrency(adminStats.totalDonationsAmountThisMonth)} VND`, label: t("donation:stats_this_month") },
  ], [adminStats, t]);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1);
  };

  const handleConfirmCloseFund = async () => {
    if (!closeDialogCampaign?.id || isClosingFund) return;
    setIsClosingFund(true);
    try {
      await fundApi.closeFund(closeDialogCampaign.id);
      enqueueSnackbar(t("donation:close_fund_success"), { variant: "success" });
      setCloseDialogCampaign(null);
      setRefreshToken((prev) => prev + 1);
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message ?? t("donation:error_close_fund"), { variant: "error" });
    } finally {
      setIsClosingFund(false);
    }
  };

  return (
    <AlumniContentLayout
      variant="one"
      maxWidth="lg"
      pageTitle={t("donation:title")}
      meta={<meta name="description" content={t("donation:meta_description")} />}
      title={t("donation:title")}
      description={t("donation:page_description")}
      uppercaseTitle
      actions={isAdmin && (
        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end" useFlexGap>
          <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => navigate("/post/donation")} sx={{ textTransform: "none", fontWeight: 700 }}>
            {t("donation:create_fund")}
          </Button>
          <Button variant="outlined" color="primary" startIcon={<FormatListBulletedIcon />} onClick={() => navigate("/admin/donations")} sx={{ textTransform: "none", fontWeight: 700 }}>
            {t("donation:manage_funds")}
          </Button>
        </Stack>
      )}
      stats={isAdmin ? <StatsBanner items={adminBannerItems} /> : null}
      filters={{ config: donationFilters, value: filters, onChange: handleFiltersChange }}
      search={{ value: search, onChange: handleSearchChange, placeholder: t("donation:search_placeholder") }}
      after={(
        <DonationCloseDialog open={Boolean(closeDialogCampaign)} campaign={closeDialogCampaign} onClose={() => setCloseDialogCampaign(null)} onConfirm={handleConfirmCloseFund} isSubmitting={isClosingFund} />
      )}
    >

            {errorMessage && (
              <Box sx={{ mb: 3, p: 2, borderRadius: 2, border: "1px solid #f2b8b5", backgroundColor: "#fff4f2" }}>
                <Typography sx={{ color: "#9f2f2f", fontWeight: 600 }}>{errorMessage}</Typography>
              </Box>
            )}

            {!isLoading && !errorMessage && !featuredCampaign && campaigns.length === 0 && (
              <Box sx={{ mb: 3, p: 2.2, borderRadius: 2, border: "1px solid #dbe6f8", backgroundColor: "#f8fbff" }}>
                <Typography sx={{ color: "#43608e", fontWeight: 600 }}>{t("donation:no_funds_filtered")}</Typography>
              </Box>
            )}

            {/* FEATURED DONATION */}
            {featuredCampaign && (
              <Box sx={{ cursor: "pointer" }} onClick={() => navigate(`/donations/${featuredCampaign.id}`)}>
                <FeaturedArticleDonationCard
                  campaign={featuredCampaign} isAdmin={isAdmin}
                  onNavigate={() => navigate(`/donations/${featuredCampaign.id}`)}
                  onEdit={() => navigate(`/donations/${featuredCampaign.id}/edit`)}
                  onClose={() => setCloseDialogCampaign(featuredCampaign)}
                />
              </Box>
            )}

            {campaigns.length > 0 && (
              <Box>
                <Typography variant="h4" fontWeight={700} mb={3}>
                  {t("donation:open_funds")}
                </Typography>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 4 }}>
                  {campaigns.map((campaign) => (
                    <Box key={campaign.id} sx={{ cursor: "pointer", display: "flex", minWidth: 0 }}>
                      <ArticleDonationCard
                        campaign={campaign} isAdmin={isAdmin}
                        onNavigate={() => navigate(`/donations/${campaign.id}`)}
                        onEdit={() => navigate(`/donations/${campaign.id}/edit`)}
                        onClose={() => setCloseDialogCampaign(campaign)}
                      />
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {(featuredCampaign || campaigns.length > 0) && (
              <Stack direction="row" justifyContent="center" alignItems="center" sx={{ mt: 3.5 }}>
                <Pagination count={pageCount || 1} page={page} onChange={handlePageChange} color="primary" shape="rounded" size="large" sx={{ "& .MuiPaginationItem-root": { fontWeight: 700, minWidth: 38, height: 38 } }} />
              </Stack>
            )}
    </AlumniContentLayout>
  );
}
