import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Container,
  LinearProgress,
  Pagination,
  Stack,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { useSnackbar } from "notistack";
import Page from "../../components/Page";
import { useAuth } from "../../hooks/useAuth";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";
import useOrganizationStore from "../../stores/organizationStore";
import { fundApi } from "../../api/fundApi";
import DonationHeader from "./components/DonationHeader";
import DonationFiltersBar from "./components/DonationFiltersBar";
import DonationSearchBox from "./components/DonationSearchBox";
import DonationCampaignGrid from "./components/DonationCampaignGrid";
import DonationCloseDialog from "./components/DonationCloseDialog";

const FILTER_OPTIONS = {
  trending: [
    { value: "none", label: "No" },
    { value: "asc", label: "ASC" },
    { value: "desc", label: "DESC" },
  ],
};

const DEFAULT_ADMIN_STATS = {
  totalCurrentAmount: 0,
  totalFunds: 0,
  totalDonations: 0,
  totalDonationsAmountThisMonth: 0,
};

const DEFAULT_FILTERS = {
  statusId: "all",
  timeStartedFrom: "",
  timeStartedTo: "",
  trending: "none",
  minAmount: "",
  maxAmount: "",
};

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
  const [campaigns, setCampaigns] = useState([]);
  const [statusOptions, setStatusOptions] = useState([{ value: "all", label: "Tất cả" }]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [draftSearch, setDraftSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [amountAnchorEl, setAmountAnchorEl] = useState(null);
  const [closeDialogCampaign, setCloseDialogCampaign] = useState(null);
  const [isClosingFund, setIsClosingFund] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [adminStats, setAdminStats] = useState(DEFAULT_ADMIN_STATS);
  const warningSetRef = useRef(new Set());
  const amountMenuOpen = Boolean(amountAnchorEl);
  const closeDialogOpen = Boolean(closeDialogCampaign);
  const pageSize = 3;

  const handleFilterChange = (key) => (event) => {
    setDraftFilters((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const applySearchAndFilters = () => {
    setAppliedFilters(draftFilters);
    setAppliedSearch(draftSearch);
    setPage(1);
  };

  const clearAllFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setDraftSearch("");
    setAppliedSearch("");
    setPage(1);
    setAmountAnchorEl(null);
  };

  const handleFilterSectionKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applySearchAndFilters();
    }
  };

  useEffect(() => {
    let ignore = false;
    const fetchStatuses = async () => {
      setIsLoadingStatus(true);
      try {
        const statuses = await fundApi.getFundStatuses();
        if (ignore) return;
        setStatusOptions([
          { value: "all", label: "Tất cả" },
          ...statuses.map((item) => ({
            value: String(item.id),
            label: item.name,
          })),
        ]);
      } catch (error) {
        if (ignore) return;
        enqueueSnackbar(error?.response?.data?.message ?? "Không thể tải danh sách trạng thái quỹ.", { variant: "error" });
      } finally {
        if (!ignore) setIsLoadingStatus(false);
      }
    };

    fetchStatuses();

    return () => {
      ignore = true;
    };
  }, [enqueueSnackbar]);

  useEffect(() => {
    if (!isAdmin) return;
    let ignore = false;

    const fetchStatistics = async () => {
      try {
        const stats = await fundApi.getFundStatistics();
        if (ignore) return;
        setAdminStats({
          totalCurrentAmount: Number(stats?.totalCurrentAmount ?? 0),
          totalFunds: Number(stats?.totalFunds ?? 0),
          totalDonations: Number(stats?.totalDonations ?? 0),
          totalDonationsAmountThisMonth: Number(stats?.totalDonationsAmountThisMonth ?? 0),
        });
      } catch (error) {
        if (ignore) return;
        setAdminStats(DEFAULT_ADMIN_STATS);
        enqueueSnackbar(error?.response?.data?.message ?? "Không thể tải thống kê quỹ.", { variant: "error" });
      }
    };

    fetchStatistics();

    return () => {
      ignore = true;
    };
  }, [enqueueSnackbar, isAdmin]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      let ignore = false;
      const fetchFunds = async () => {
        setIsLoading(true);
        setErrorMessage("");
        try {
          const params = {
            page: page - 1,
            limit: pageSize,
            organizationId: organizationId != null ? String(organizationId) : undefined,
            q: appliedSearch.trim() || undefined,
            statusId: appliedFilters.statusId !== "all" ? appliedFilters.statusId : undefined,
            targetAmountMin: appliedFilters.minAmount || undefined,
            targetAmountMax: appliedFilters.maxAmount || undefined,
            sortBy: appliedFilters.trending !== "none" ? "donor_count" : undefined,
            direction: appliedFilters.trending !== "none" ? appliedFilters.trending : undefined,
            timeStartedFrom: appliedFilters.timeStartedFrom ? toIsoStartOfDay(appliedFilters.timeStartedFrom) : undefined,
            timeStartedTo: appliedFilters.timeStartedTo ? toIsoEndOfDay(appliedFilters.timeStartedTo) : undefined,
          };
          const payload = await fundApi.getFunds(params);
          if (ignore) return;
          const warnings = payload?.warnings ?? [];
          warnings.forEach((warning) => {
            const key = String(warning);
            if (!warningSetRef.current.has(key)) {
              warningSetRef.current.add(key);
              enqueueSnackbar(key, { variant: "warning" });
            }
          });
          const pagedData = payload?.data;
          setCampaigns(pagedData?.items ?? []);
          setPageCount(Math.max(1, Number(pagedData?.totalPage ?? 1)));
        } catch (error) {
          if (ignore) return;
          setCampaigns([]);
          setPageCount(1);
          setErrorMessage(error?.response?.data?.message ?? "Không thể tải danh sách quỹ quyên góp.");
        } finally {
          if (!ignore) setIsLoading(false);
        }
      };

      fetchFunds();

      return () => {
        ignore = true;
      };
    }, 300);

    return () => clearTimeout(debounce);
  }, [appliedFilters, appliedSearch, enqueueSnackbar, organizationId, page, refreshToken]);

  const amountButtonLabel = useMemo(() => {
    const { minAmount, maxAmount } = draftFilters;
    if (!minAmount && !maxAmount) return "Mức quyên góp";
    return `Mức quyên góp: ${minAmount || 0} - ${maxAmount || "∞"}`;
  }, [draftFilters]);

  const adminBannerItems = useMemo(
    () => [
      { value: `${formatCurrency(adminStats.totalCurrentAmount)} VND`, label: "tổng quỹ gây được" },
      { value: formatCurrency(adminStats.totalFunds), label: "quỹ đang mở" },
      { value: formatCurrency(adminStats.totalDonations), label: "lượt quyên góp" },
      { value: `${formatCurrency(adminStats.totalDonationsAmountThisMonth)} VND`, label: "tổng quỹ tháng này" },
    ],
    [adminStats]
  );

  const handleOpenCloseDialog = (campaign) => {
    setCloseDialogCampaign(campaign);
  };

  const handleCloseDialog = () => {
    setCloseDialogCampaign(null);
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
    <Page
      title="Quyên góp"
      meta={<meta name="description" content="Trang quyên góp hiện đại cho cộng đồng cựu sinh viên." />}
    >
      <Box sx={{ minHeight: "100vh", background: "linear-gradient(180deg, #f7faff 0%, #ffffff 46%)" }}>
        <Container maxWidth="xl" sx={{ py: { xs: 4, md: 5 } }}>
          <DonationHeader
            isAdmin={isAdmin}
            adminBannerItems={adminBannerItems}
            onCreateFund={() => navigate("/donations/create")}
          />

          <DonationFiltersBar
            draftFilters={draftFilters}
            statusOptions={statusOptions}
            filterOptions={FILTER_OPTIONS}
            amountButtonLabel={amountButtonLabel}
            amountAnchorEl={amountAnchorEl}
            amountMenuOpen={amountMenuOpen}
            onFilterSectionKeyDown={handleFilterSectionKeyDown}
            onFilterChange={handleFilterChange}
            onOpenAmountMenu={(event) => setAmountAnchorEl(event.currentTarget)}
            onCloseAmountMenu={() => setAmountAnchorEl(null)}
            onResetAmountRange={() => {
              setDraftFilters((prev) => ({ ...prev, minAmount: "", maxAmount: "" }));
            }}
            onApplyAmountMenu={() => setAmountAnchorEl(null)}
            onClearAllFilters={clearAllFilters}
            onApplySearchAndFilters={applySearchAndFilters}
          />

          <DonationSearchBox
            value={draftSearch}
            onChange={(event) => {
              setDraftSearch(event.target.value);
            }}
            onKeyDown={handleFilterSectionKeyDown}
          />

          {isLoading || isLoadingStatus ? (
            <Box sx={{ mb: 3 }}>
              <LinearProgress sx={{ height: 8, borderRadius: 999 }} />
            </Box>
          ) : null}

          {errorMessage ? (
            <Box sx={{ mb: 3, p: 2, borderRadius: 2, border: "1px solid #f2b8b5", backgroundColor: "#fff4f2" }}>
              <Typography sx={{ color: "#9f2f2f", fontWeight: 600 }}>{errorMessage}</Typography>
            </Box>
          ) : null}

          {!isLoading && !errorMessage && campaigns.length === 0 ? (
            <Box sx={{ mb: 3, p: 2.2, borderRadius: 2, border: "1px solid #dbe6f8", backgroundColor: "#f8fbff" }}>
              <Typography sx={{ color: "#43608e", fontWeight: 600 }}>
                Không có quỹ nào phù hợp với bộ lọc hiện tại.
              </Typography>
            </Box>
          ) : null}

          <DonationCampaignGrid
            campaigns={campaigns}
            isAdmin={isAdmin}
            onNavigate={(campaign) => navigate(`/donations/${campaign.id}`)}
            onEdit={(campaign) => navigate(`/donations/${campaign.id}/edit`)}
            onClose={handleOpenCloseDialog}
          />

          <Stack direction="row" justifyContent="center" alignItems="center" sx={{ mt: 3.5 }}>
            <Pagination
              count={pageCount || 1}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              shape="rounded"
              size="large"
              sx={{
                "& .MuiPaginationItem-root": { fontWeight: 700, minWidth: 38, height: 38 },
              }}
            />
          </Stack>

          <DonationCloseDialog
            open={closeDialogOpen}
            campaign={closeDialogCampaign}
            onClose={handleCloseDialog}
            onConfirm={handleConfirmCloseFund}
            isSubmitting={isClosingFund}
          />
        </Container>
      </Box>
    </Page>
  );
}