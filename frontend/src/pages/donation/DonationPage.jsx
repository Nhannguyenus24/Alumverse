import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Menu,
  Pagination,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import styled from "@emotion/styled";
import dayjs from "dayjs";
import { useSnackbar } from "notistack";
import Page from "../../components/Page";
import { useAuth } from "../../hooks/useAuth";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";
import useOrganizationStore from "../../stores/organizationStore";
import { fundApi } from "../../api/fundApi";
import { truncateText } from "../../utils/text";

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

const CAMPAIGN_DESCRIPTION_MAX_CHARS = 120;
const LOGO_FALLBACK_URL = "https://placehold.co/800x450/eef3ff/0f3a7a?text=Fund";
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

const StatsSummaryRoot = styled(Box)({
  width: "100%",
  background: "#0f2f5e",
  borderRadius: 12,
  padding: "16px 20px",
  color: "#ffffff",
  boxShadow: "0 8px 18px rgba(14, 38, 80, 0.24)",
});

const StatsGrid = styled(Box)({
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 8,
  "@media (max-width: 900px)": {
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    rowGap: 12,
  },
  "@media (max-width: 600px)": {
    gridTemplateColumns: "1fr",
  },
});

const StatsCell = styled(Box)({
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minHeight: 62,
  padding: "2px 6px",
});

const ProgressActionRoot = styled(Box)({
  marginTop: "auto",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "end",
  gap: 10,
});

const ProgressTrack = styled(LinearProgress)({
  height: 32,
  borderRadius: 999,
  backgroundColor: "#e4e7ef",
  overflow: "hidden",
  "& .MuiLinearProgress-bar": {
    borderRadius: 999,
    backgroundColor: "#123b7a",
  },
});

function StatsSummaryBar({ items }) {
  return (
    <StatsSummaryRoot>
      <StatsGrid>
        {items.map((item) => (
          <StatsCell key={item.label}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.02rem", md: "1.16rem" }, lineHeight: 1.2 }}>
              {item.value}
            </Typography>
            <Typography sx={{ mt: 0.4, opacity: 0.85, fontSize: "0.78rem", textTransform: "lowercase" }}>
              {item.label}
            </Typography>
          </StatsCell>
        ))}
      </StatsGrid>
    </StatsSummaryRoot>
  );
}

function ProgressActionBar({ progress, amountLabel, onEdit, onClose }) {
  return (
    <ProgressActionRoot>
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <Typography sx={{ mb: 0.7, color: "#2f4b75", fontWeight: 700, fontSize: "0.84rem" }}>{amountLabel}</Typography>
        <ProgressTrack variant="determinate" value={progress} />
      </Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: "flex-end" }}>
        <Button
          variant="outlined"
          startIcon={<EditOutlinedIcon />}
          onClick={onEdit}
          sx={{
            borderRadius: 2,
            px: 1.6,
            minHeight: 36,
            textTransform: "none",
            fontWeight: 700,
            color: "#2f3643",
            borderColor: "#cdd3e1",
          }}
        >
          Sửa
        </Button>
        <Button
          variant="contained"
          startIcon={<LockOutlinedIcon />}
          onClick={onClose}
          sx={{
            borderRadius: 2,
            px: 1.6,
            minHeight: 36,
            textTransform: "none",
            fontWeight: 700,
            backgroundColor: "#f2cd3c",
            color: "#29231a",
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "#e2bd2f",
              boxShadow: "none",
            },
          }}
        >
          Đóng
        </Button>
      </Stack>
    </ProgressActionRoot>
  );
}

function FilterDropdown({ label, value, onChange, options }) {
  return (
    <FormControl
      size="small"
      sx={{
        minWidth: { xs: "100%", sm: 180 },
        "& .MuiOutlinedInput-root": {
          borderRadius: 999,
          backgroundColor: "#f7faff",
        },
      }}
    >
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={onChange}
        MenuProps={{
          disableScrollLock: true,
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function CampaignCard({ campaign, onNavigate, onEdit, onClose, isAdmin }) {
  const progressValue = Math.min(
    100,
    Math.round(((campaign.currentAmount ?? 0) / Math.max(campaign.targetAmount ?? 1, 1)) * 100)
  );
  const startedAt = campaign.timeStarted ? dayjs(campaign.timeStarted).format("DD/MM/YYYY") : "--";
  const endedAt = campaign.timeEnded ? dayjs(campaign.timeEnded).format("DD/MM/YYYY") : "--";

  return (
    <Card
      elevation={0}
      onClick={onNavigate}
      sx={{
        height: 470,
        width: "100%",
        minWidth: 0,
        cursor: "pointer",
        borderRadius: 3,
        border: "1px solid #e4ebfa",
        overflow: "hidden",
        transition: "all 0.25s ease",
        boxShadow: "0 8px 24px rgba(18, 59, 122, 0.08)",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 14px 30px rgba(18, 59, 122, 0.15)",
        },
      }}
    >
      <CardMedia component="img" image={campaign.logoUrl || LOGO_FALLBACK_URL} alt={campaign.name} sx={{ height: 170, width: "100%" }} />
      <CardContent sx={{ p: 2.2, display: "flex", flexDirection: "column", gap: 0.9, minWidth: 0, height: 300 }}>
        <Typography variant="caption" sx={{ color: "#5c75a4", fontWeight: 600 }}>
          {`${startedAt} - ${endedAt}`}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: "1.02rem",
            color: "#0f2f5e",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            minWidth: 0,
            overflowWrap: "anywhere",
          }}
        >
          {campaign.name}
        </Typography>
        <Typography
          sx={{
            color: "#4b6088",
            fontSize: "0.92rem",
            fontWeight: 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
          }}
        >
          {campaign.managerName || "Chưa cập nhật"}
        </Typography>
        <Typography sx={{ color: "#6480b2", fontSize: "0.86rem" }}>
          {campaign.donorCount ?? 0} người đã quyên góp
        </Typography>
        <Typography
          sx={{
            color: "#334968",
            lineHeight: 1.5,
            minHeight: 64,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            minWidth: 0,
            overflowWrap: "anywhere",
          }}
        >
          {truncateText(campaign.descriptionShort || "", CAMPAIGN_DESCRIPTION_MAX_CHARS)}
        </Typography>
        {isAdmin ? (
          <ProgressActionBar
            progress={progressValue}
            amountLabel={`${formatCurrency(campaign.currentAmount)} / ${formatCurrency(campaign.targetAmount)} (VND)`}
            onEdit={(event) => {
              event.stopPropagation();
              onEdit?.();
            }}
            onClose={(event) => {
              event.stopPropagation();
              onClose?.();
            }}
          />
        ) : (
          <Button
            variant="contained"
            onClick={(event) => {
              event.stopPropagation();
              onNavigate();
            }}
            sx={{
              mt: "auto",
              borderRadius: 999,
              py: 1,
              textTransform: "none",
              fontWeight: 700,
              backgroundColor: "#1155cc",
              "&:hover": { backgroundColor: "#0d45a3" },
            }}
          >
            Quyên góp
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function DonationPage() {
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user, isAuthenticated } = useAuth();
  const organizationId = useOrganizationStore((state) => state.organization?.id ?? null);
  const isAdmin = isAuthenticated && user?.role === "ADMIN";
  const [search, setSearch] = useState("");
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
  }, [appliedFilters, appliedSearch, enqueueSnackbar, organizationId, page]);

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

  const handleConfirmCloseFund = () => {
    setCloseDialogCampaign(null);
  };

  return (
    <Page
      title="Quyên góp"
      meta={<meta name="description" content="Trang quyên góp hiện đại cho cộng đồng cựu sinh viên." />}
    >
      <Box sx={{ minHeight: "100vh", background: "linear-gradient(180deg, #f7faff 0%, #ffffff 46%)" }}>
        <Container maxWidth="xl" sx={{ py: { xs: 4, md: 5 } }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: "2rem", md: "2.8rem" },
              fontWeight: 800,
              color: "#102f5f",
              mb: 1,
            }}
          >
            Quyên góp
          </Typography>
          <Typography sx={{ color: "#4f678d", mb: 3.5, maxWidth: 860, lineHeight: 1.7 }}>
            Chung tay giúp đỡ cộng đồng, đồng hành cùng những hoàn cảnh đặc biệt và lan tỏa tinh thần sẻ chia
            của cựu sinh viên qua từng chiến dịch ý nghĩa.
          </Typography>

          {isAdmin && (
            <Box sx={{ mb: 2.8 }}>
              <StatsSummaryBar items={adminBannerItems} />
            </Box>
          )}

          {isAdmin && (
            <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1.6 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate("/donations/create")}
                sx={{ borderRadius: 999, px: 2.2, textTransform: "none", fontWeight: 700 }}
              >
                Mở thêm quỹ
              </Button>
            </Stack>
          )}

          <Stack direction="row" spacing={1.2} flexWrap="wrap" sx={{ mb: 2.2, rowGap: 1.2 }} onKeyDown={handleFilterSectionKeyDown}>
            <FilterDropdown
              label="Status"
              value={draftFilters.statusId}
              onChange={handleFilterChange("statusId")}
              options={statusOptions}
            />
            <FilterDropdown
              label="Thịnh hành"
              value={draftFilters.trending}
              onChange={handleFilterChange("trending")}
              options={FILTER_OPTIONS.trending}
            />
            <TextField
              label="Time started từ"
              type="date"
              size="small"
              value={draftFilters.timeStartedFrom}
              onChange={handleFilterChange("timeStartedFrom")}
              InputLabelProps={{ shrink: true }}
              sx={{
                minWidth: { xs: "100%", sm: 190 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 999,
                  backgroundColor: "#f7faff",
                },
              }}
            />
            <TextField
              label="Time started đến"
              type="date"
              size="small"
              value={draftFilters.timeStartedTo}
              onChange={handleFilterChange("timeStartedTo")}
              InputLabelProps={{ shrink: true }}
              sx={{
                minWidth: { xs: "100%", sm: 190 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 999,
                  backgroundColor: "#f7faff",
                },
              }}
            />
            <Button
              onClick={(event) => setAmountAnchorEl(event.currentTarget)}
              sx={{
                minWidth: { xs: "100%", sm: 200 },
                justifyContent: "space-between",
                borderRadius: 999,
                px: 2,
                py: 1,
                textTransform: "none",
                color: "#2f4b75",
                border: "1px solid #d8e2f7",
                backgroundColor: "#f7faff",
                fontWeight: 500,
                "&:hover": { backgroundColor: "#eef4ff", borderColor: "#b8caef" },
              }}
            >
              {amountButtonLabel}
            </Button>
            <Menu
              anchorEl={amountAnchorEl}
              open={amountMenuOpen}
              onClose={() => setAmountAnchorEl(null)}
              disableScrollLock
              transformOrigin={{ horizontal: "left", vertical: "top" }}
              anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
            >
              <Box sx={{ width: 280, p: 2, display: "flex", flexDirection: "column", gap: 1.2 }}>
                <TextField
                  label="Min"
                  size="small"
                  type="number"
                  value={draftFilters.minAmount}
                  onChange={handleFilterChange("minAmount")}
                  placeholder="0"
                />
                <TextField
                  label="Max"
                  size="small"
                  type="number"
                  value={draftFilters.maxAmount}
                  onChange={handleFilterChange("maxAmount")}
                  placeholder="0"
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => {
                      setDraftFilters((prev) => ({ ...prev, minAmount: "", maxAmount: "" }));
                    }}
                  >
                    Xóa
                  </Button>
                  <Button variant="contained" fullWidth onClick={() => setAmountAnchorEl(null)}>
                    Áp dụng
                  </Button>
                </Stack>
              </Box>
            </Menu>
            <Button
              variant="outlined"
              onClick={clearAllFilters}
              sx={{ borderRadius: 999, px: 2.2, textTransform: "none", fontWeight: 700 }}
            >
              Xóa hết bộ lọc
            </Button>
            <Button
              variant="contained"
              onClick={applySearchAndFilters}
              sx={{ borderRadius: 999, px: 2.2, textTransform: "none", fontWeight: 700 }}
            >
              Áp dụng bộ lọc
            </Button>
          </Stack>

          <TextField
            fullWidth
            placeholder="Tìm kiếm chiến dịch quyên góp..."
            value={draftSearch}
            onChange={(event) => {
              setDraftSearch(event.target.value);
            }}
            onKeyDown={handleFilterSectionKeyDown}
            sx={{
              mb: 4,
              "& .MuiOutlinedInput-root": {
                borderRadius: 999,
                backgroundColor: "#ffffff",
                boxShadow: "0 4px 16px rgba(17, 72, 156, 0.08)",
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#6581b4" }} />
                </InputAdornment>
              ),
            }}
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

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(3, minmax(0, 1fr))",
              },
              gap: 2.5,
            }}
          >
            {campaigns.map((campaign) => (
              <Box key={campaign.id} sx={{ display: "flex", minWidth: 0 }}>
                <CampaignCard
                  campaign={campaign}
                  onNavigate={() => navigate(`/donations/${campaign.id}`)}
                  onEdit={() => navigate(`/donations/${campaign.id}/edit`)}
                  onClose={() => handleOpenCloseDialog(campaign)}
                  isAdmin={isAdmin}
                />
              </Box>
            ))}
          </Box>

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

          <Dialog
            open={closeDialogOpen}
            onClose={handleCloseDialog}
            disableScrollLock
            maxWidth="xs"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
                border: "1px solid #d6e5ff",
                boxShadow: "0 14px 36px rgba(18, 59, 122, 0.2)",
                background: "linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%)",
              },
            }}
          >
            <DialogTitle sx={{ color: "#0f2f5e", fontWeight: 800, pb: 1 }}>
              Xác nhận đóng quỹ sớm
            </DialogTitle>
            <DialogContent sx={{ pt: "8px !important" }}>
              <Typography sx={{ color: "#33527d", lineHeight: 1.7 }}>
                Bạn có chắc muốn đóng sớm quỹ{" "}
                <Box component="span" sx={{ color: "#0d3f8f", fontWeight: 700 }}>
                  {closeDialogCampaign?.name}
                </Box>{" "}
                không? Quỹ sẽ ngừng nhận thêm quyên góp sau khi xác nhận.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.4, gap: 1 }}>
              <Button
                onClick={handleCloseDialog}
                variant="outlined"
                sx={{
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 700,
                  color: "#2b4d81",
                  borderColor: "#b6cdee",
                  "&:hover": { borderColor: "#95b6e7", backgroundColor: "#edf4ff" },
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={handleConfirmCloseFund}
                variant="contained"
                sx={{
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 700,
                  backgroundColor: "#1155cc",
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor: "#0d45a3",
                    boxShadow: "none",
                  },
                }}
              >
                Xác nhận đóng
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </Page>
  );
}