import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Box, Container, LinearProgress, Pagination, Stack, Typography } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import dayjs from "dayjs";
import { useSnackbar } from "notistack";
import Page from "../../components/Page";
import { useAuth } from "../../hooks/useAuth";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";
import usePaginationScrollToTop from "../../hooks/usePaginationScrollToTop";
import useOrganizationStore from "../../stores/organizationStore";
import { fundApi } from "../../utils/api";
import SearchBar from "../../components/SearchBar";
import Sidebar from "../../components/Sidebar";
import DynamicFilterBar from "../../components/DynamicFilterBar";
import ArticleDonationCard from "../../components/articles/ArticleDonationCard";
import FeaturedArticleDonationCard from "../../components/articles/FeaturedArticleDonationCard";
import DonationCloseDialog from "../../components/donation/DonationCloseDialog";

const DEFAULT_ADMIN_STATS = { totalCurrentAmount: 0, totalFunds: 0, totalDonations: 0, totalDonationsAmountThisMonth: 0 };
const DEFAULT_FILTERS = { all: true, statusId: "", timeStartedFrom: "", timeStartedTo: "", trending: "", amountMin: "", amountMax: "" };

const DONATION_SIDEBAR_ITEMS = [
  { id: "list", label: "Quyên góp", icon: <FormatListBulletedIcon /> },
  { id: "create", label: "Mở quỹ quyên góp", icon: <AddCircleOutlineIcon /> },
];

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
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user, isAuthenticated } = useAuth();
  const organizationId = useOrganizationStore((state) => state.organization?.id ?? null);
  const isAdmin = isAuthenticated && user?.role === "ADMIN";

  const [featuredCampaign, setFeaturedCampaign] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
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

  const gridPageSize = 3;
  const handlePageChange = usePaginationScrollToTop({ currentPage: page, setPage });

  const donationFilters = useMemo(() => [
    { type: "dropdown", key: "statusId", label: "Trạng thái", multiple: false, options: statusOptions.map((o) => ({ value: o.value, label: o.label })) },
    { type: "date", key: "timeStartedFrom", label: "Từ ngày" },
    { type: "date", key: "timeStartedTo", label: "Đến ngày" },
    { type: "dropdown", key: "trending", label: "Xu hướng", multiple: false, options: [{ value: "asc", label: "ASC" }, { value: "desc", label: "DESC" }] },
    { type: "range-input", key: "amount", label: "Mức quyên góp" },
  ], [statusOptions]);

  useEffect(() => {
    let ignore = false;
    setIsLoadingStatus(true);
    fundApi.getFundStatuses()
      .then((statuses) => {
        if (ignore) return;
        setStatusOptions(statuses.map((item) => ({ value: String(item.id), label: item.name })));
      })
      .catch((error) => {
        if (ignore) return;
        enqueueSnackbar(error?.response?.data?.message ?? "Không thể tải danh sách trạng thái quỹ.", { variant: "error" });
      })
      .finally(() => { if (!ignore) setIsLoadingStatus(false); });
    return () => { ignore = true; };
  }, [enqueueSnackbar]);

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
        enqueueSnackbar(error?.response?.data?.message ?? "Không thể tải thống kê quỹ.", { variant: "error" });
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
        q: search.trim() || undefined, statusId: filters.statusId || undefined,
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

          if (page === 1 && items.length > 0 && !featuredCampaign) {
            setFeaturedCampaign(items[0]);
            setCampaigns(items.slice(1));
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
          setErrorMessage(error?.response?.data?.message ?? "Không thể tải danh sách quỹ quyên góp.");
        })
        .finally(() => { if (!ignore) setIsLoading(false); });

      return () => { ignore = true; };
    }, 300);
    return () => clearTimeout(debounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, search, enqueueSnackbar, organizationId, page, refreshToken]);

  const adminBannerItems = useMemo(() => [
    { value: `${formatCurrency(adminStats.totalCurrentAmount)} VND`, label: "tổng quỹ gây được" },
    { value: formatCurrency(adminStats.totalFunds), label: "quỹ đang mở" },
    { value: formatCurrency(adminStats.totalDonations), label: "lượt quyên góp" },
    { value: `${formatCurrency(adminStats.totalDonationsAmountThisMonth)} VND`, label: "tổng quỹ tháng này" },
  ], [adminStats]);

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
      enqueueSnackbar("Đóng quỹ thành công.", { variant: "success" });
      setCloseDialogCampaign(null);
      setRefreshToken((prev) => prev + 1);
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message ?? "Không thể đóng quỹ lúc này.", { variant: "error" });
    } finally {
      setIsClosingFund(false);
    }
  };

  return (
    <Page title="Quyên góp" meta={<meta name="description" content="Trang quyên góp hiện đại cho cộng đồng cựu sinh viên." />}>
      <Container maxWidth={isAdmin ? "xl" : "lg"} sx={{ pt: { xs: 2, sm: 3, md: 4 }, pb: 6, px: { xs: 2, sm: 3, lg: 6 } }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: 2, md: 3 } }}>
          {isAdmin && (
            <Stack spacing={2} sx={{ width: { xs: "100%", md: 260 }, flexShrink: 0 }}>
              <Sidebar items={DONATION_SIDEBAR_ITEMS} useRouting={false} value="list" onChange={(itemId) => { if (itemId === "create") navigate("/post/donation"); }} />
            </Stack>
          )}

          <Stack spacing={5} sx={{ flex: 1, minWidth: 0, width: "100%", px: { xs: 1.5, sm: 2, md: 2.75 } }}>
            <Stack spacing={2}>
              <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
                <Typography variant="h1" fontWeight={800} color="primary.main" sx={{ fontSize: { xs: "1.8rem", md: "2.3rem" } }}>
                  QUYÊN GÓP
                </Typography>

                {isAdmin && (
                  <Button variant="contained" onClick={() => navigate("/post/donation")} sx={{ textTransform: "none", fontWeight: 700 }}>
                    Mở quỹ quyên góp
                  </Button>
                )}
              </Box>

              <Typography color="text.secondary">
                Chung tay giúp đỡ cộng đồng, đồng hành cùng những hoàn cảnh đặc biệt và lan tỏa tinh thần sẻ chia của cựu sinh viên qua từng chiến dịch ý nghĩa.
              </Typography>

              {isAdmin && (
                <Box sx={{ backgroundColor: "primary.main", borderRadius: 2, px: { xs: 3, md: 6 }, py: { xs: 3, md: 4 }, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr 1fr" }, gap: 3, textAlign: "center" }}>
                  {adminBannerItems.map((item) => (
                    <Box key={item.label}>
                      <Typography variant="h2" fontWeight={700} color="common.white">{item.value}</Typography>
                      <Typography variant="body2" color="common.white" sx={{ opacity: 0.9 }}>{item.label}</Typography>
                    </Box>
                  ))}
                </Box>
              )}

              <DynamicFilterBar config={donationFilters} value={filters} onChange={handleFiltersChange} />
              <SearchBar value={search} onChange={handleSearchChange} placeholder="Tìm kiếm chiến dịch quyên góp..." />
            </Stack>

            {(isLoading || isLoadingStatus) && (
              <Box sx={{ mb: 3 }}>
                <LinearProgress sx={{ height: 8, borderRadius: 999 }} />
              </Box>
            )}

            {errorMessage && (
              <Box sx={{ mb: 3, p: 2, borderRadius: 2, border: "1px solid #f2b8b5", backgroundColor: "#fff4f2" }}>
                <Typography sx={{ color: "#9f2f2f", fontWeight: 600 }}>{errorMessage}</Typography>
              </Box>
            )}

            {!isLoading && !errorMessage && campaigns.length === 0 && (
              <Box sx={{ mb: 3, p: 2.2, borderRadius: 2, border: "1px solid #dbe6f8", backgroundColor: "#f8fbff" }}>
                <Typography sx={{ color: "#43608e", fontWeight: 600 }}>Không có quỹ nào phù hợp với bộ lọc hiện tại.</Typography>
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
                  Các quỹ đang mở
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

            <Stack direction="row" justifyContent="center" alignItems="center" sx={{ mt: 3.5 }}>
              <Pagination count={pageCount || 1} page={page} onChange={handlePageChange} color="primary" shape="rounded" size="large" sx={{ "& .MuiPaginationItem-root": { fontWeight: 700, minWidth: 38, height: 38 } }} />
            </Stack>
          </Stack>
        </Box>

        <DonationCloseDialog open={Boolean(closeDialogCampaign)} campaign={closeDialogCampaign} onClose={() => setCloseDialogCampaign(null)} onConfirm={handleConfirmCloseFund} isSubmitting={isClosingFund} />
      </Container>
    </Page>
  );
}