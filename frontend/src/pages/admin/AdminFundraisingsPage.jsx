import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router";
import { useSnackbar } from "notistack";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import LaunchOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import GroupIcon from "@mui/icons-material/Group";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { useAdminSystemContext } from "../../stores/AdminStore";
import { adminOrganizationApi, fundApi } from "../../utils/api";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import SearchIcon from "@mui/icons-material/Search";

import AdminStatusChip from "../../components/admin/AdminStatusChip";
import AdminDashboardMetricTile from "../../components/admin/AdminDashboardMetricTile";
import AdminDataTable from "../../components/admin/AdminDataTable";
import useAdminFundraisingsData from "../../hooks/admin/useAdminFundraisingsData";
import { formatDateTime } from "../../utils/dateFormatter";
import { formatCurrencyVnd } from "../../utils/numberFormatter";

const AdminFundraisingsPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { setBreadcrumbs } = useOutletContext();
  const { activeOrgId, setActiveOrgId, activeOrganization } = useAdminSystemContext();
  const [organizations, setOrganizations] = useState([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [statusOptions, setStatusOptions] = useState([]);
  const [receivingOptions, setReceivingOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialCreateForm = {
    fundName: "",
    organizer: "",
    logoUrl: "",
    statusId: "",
    fundReceivingInfoId: "",
    targetAmount: "",
    descriptionShort: "",
    descriptionFull: "",
    startDate: null,
    endDate: null,
    organizationId: activeOrgId || "",
  };

  const [createForm, setCreateForm] = useState(initialCreateForm);

  useEffect(() => {
    setBreadcrumbs?.([{ label: "Quản lý gây quỹ", active: true }]);

    const fetchOrgs = async () => {
      try {
        const data = await adminOrganizationApi.getOrganizations({ page: 0, size: 200 });
        setOrganizations(data || []);
      } catch (err) {
        console.error("Failed to fetch organizations", err);
      }
    };

    const loadFormOptions = async () => {
      try {
        const [statuses, receivingInfos] = await Promise.all([
          fundApi.getFundStatuses(),
          fundApi.getActiveFundReceivingInfos(),
        ]);
        setStatusOptions(statuses ?? []);
        setReceivingOptions(receivingInfos ?? []);
      } catch (err) {
        console.error("Failed to load form options", err);
      }
    };

    fetchOrgs();
    loadFormOptions();
  }, [setBreadcrumbs]);

  const {
    fundraisings,
    filteredCount,
    search,
    setSearch,
    submitSearch,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    updateStatus,
    reload,
  } = useAdminFundraisingsData(activeOrgId);

  const [detailItem, setDetailItem] = useState(null);
  const [closeTarget, setCloseTarget] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [donationsDialogOpen, setDonationsDialogOpen] = useState(false);
  const [donationsTarget, setDonationsTarget] = useState(null);
  const [donationsList, setDonationsList] = useState([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [donationsPage, setDonationsPage] = useState(1);
  const [donationsTotalPages, setDonationsTotalPages] = useState(1);
  const [donationsSearchKeyword, setDonationsSearchKeyword] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [donationsSearchBy, setDonationsSearchBy] = useState("name");

  const loadCampaignDonations = async (fundId, pageNum = 1, keyword = "", searchByField = "name") => {
    setDonationsLoading(true);
    try {
      const params = {
        page: pageNum - 1,
        limit: 5,
      };
      if (keyword.trim()) {
        params.searchBy = searchByField;
        params.keyword = keyword.trim();
      }
      const res = await fundApi.getFundDonationsByFundId(fundId, params);
      setDonationsList(res?.items ?? []);
      setDonationsTotalPages(res?.totalPage ?? 1);
    } catch {
      enqueueSnackbar("Không thể tải danh sách lượt quyên góp.", { variant: "error" });
      setDonationsList([]);
    } finally {
      setDonationsLoading(false);
    }
  };

  useEffect(() => {
    if (donationsDialogOpen && donationsTarget) {
      loadCampaignDonations(donationsTarget.id, donationsPage, donationsSearchKeyword, donationsSearchBy);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donationsDialogOpen, donationsTarget, donationsPage, donationsSearchKeyword, donationsSearchBy]);
  const handleOpenCreateDialog = () => {
    setCreateForm({
      ...initialCreateForm,
      organizationId: activeOrgId || "",
    });
    setCreateDialogOpen(true);
  };

  const handleInputChange = (field, value) => {
    setCreateForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateFund = async (e) => {
    e.preventDefault();
    if (!createForm.fundName.trim()) {
      enqueueSnackbar("Vui lòng nhập tên quỹ quyên góp", { variant: "warning" });
      return;
    }
    if (!createForm.organizer.trim()) {
      enqueueSnackbar("Vui lòng nhập người tổ chức", { variant: "warning" });
      return;
    }
    if (!createForm.statusId) {
      enqueueSnackbar("Vui lòng chọn trạng thái", { variant: "warning" });
      return;
    }
    if (!createForm.fundReceivingInfoId) {
      enqueueSnackbar("Vui lòng chọn tài khoản nhận quỹ", { variant: "warning" });
      return;
    }
    if (!createForm.targetAmount || Number(createForm.targetAmount) <= 0) {
      enqueueSnackbar("Mục tiêu quyên góp phải lớn hơn 0", { variant: "warning" });
      return;
    }
    if (!createForm.descriptionShort.trim()) {
      enqueueSnackbar("Vui lòng nhập mô tả ngắn", { variant: "warning" });
      return;
    }
    if (!createForm.descriptionFull.trim()) {
      enqueueSnackbar("Vui lòng nhập mô tả chi tiết", { variant: "warning" });
      return;
    }
    if (!createForm.organizationId) {
      enqueueSnackbar("Vui lòng chọn tổ chức", { variant: "warning" });
      return;
    }
    if (!createForm.startDate) {
      enqueueSnackbar("Vui lòng chọn thời gian bắt đầu", { variant: "warning" });
      return;
    }
    if (!createForm.endDate) {
      enqueueSnackbar("Vui lòng chọn thời gian kết thúc", { variant: "warning" });
      return;
    }

    const start = dayjs(createForm.startDate);
    const end = dayjs(createForm.endDate);
    const nowPlusOneHour = dayjs().add(1, "hour");

    if (start.isBefore(nowPlusOneHour)) {
      enqueueSnackbar("Thời gian bắt đầu phải từ hiện tại + 1 giờ", { variant: "warning" });
      return;
    }
    if (end.isBefore(start.add(1, "hour"))) {
      enqueueSnackbar("Thời gian kết thúc phải sau thời gian bắt đầu ít nhất 1 giờ", { variant: "warning" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: createForm.fundName,
        managerName: createForm.organizer,
        logoUrl: createForm.logoUrl?.trim() || null,
        status_id: Number(createForm.statusId),
        fundReceivingInfoId: Number(createForm.fundReceivingInfoId),
        targetAmount: Number(createForm.targetAmount),
        description_short: createForm.descriptionShort,
        description_full: createForm.descriptionFull,
        organizationId: Number(createForm.organizationId),
        timeStarted: start.format("YYYY-MM-DDTHH:mm:ss"),
        timeEnded: end.format("YYYY-MM-DDTHH:mm:ss"),
      };

      await fundApi.createFund(payload);
      enqueueSnackbar("Tạo quỹ quyên góp thành công.", { variant: "success" });
      setCreateDialogOpen(false);
      reload();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || "Có lỗi xảy ra khi tạo quỹ", { variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Aggregated stats from current data for visualization
  const stats = {
    totalRaised: fundraisings.reduce(
      (acc, f) => acc + (f.raisedAmount || 0),
      0,
    ),
    activeCampaigns: fundraisings.filter((f) => f.status === "ACTIVE").length,
    totalDonors: fundraisings.reduce((acc, f) => acc + (f.donorCount || 0), 0),
    avgCompletion: fundraisings.length
      ? (
          (fundraisings.reduce(
            (acc, f) => acc + (f.raisedAmount / f.targetAmount || 0),
            0,
          ) /
            fundraisings.length) *
          100
        ).toFixed(1)
      : 0,
  };

  const columns = [
    { id: "id", label: "ID" },
    {
      id: "title",
      label: "Chiến dịch",
      render: (val) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {val}
        </Typography>
      ),
    },
    { id: "ownerName", label: "Người tạo", render: (val) => val || "-" },
    {
      id: "status",
      label: "Trạng thái",
      render: (val) => (
        <AdminStatusChip
          status={val}
          category="fundraising"
          label={
            val === "ACTIVE"
              ? "Đang chạy"
              : val === "PAUSED"
                ? "Tạm dừng"
                : val === "COMPLETED"
                  ? "Hoàn thành"
                  : "Bản nháp"
          }
        />
      ),
    },
    {
      id: "targetAmount",
      label: "Mục tiêu",
      align: "right",
      render: (val) => formatCurrencyVnd(val),
    },
    {
      id: "raisedAmount",
      label: "Đã quyên góp",
      align: "right",
      render: (val) => (
        <Typography
          variant="body2"
          color="success.main"
          sx={{ fontWeight: 700 }}
        >
          {formatCurrencyVnd(val)}
        </Typography>
      ),
    },
    { id: "donorCount", label: "Lượt ủng hộ", align: "right" },
    {
      id: "updatedAt",
      label: "Cập nhật",
      render: (val) => formatDateTime(val),
    },
    {
      id: "actions",
      label: "",
      align: "right",
      render: (_, fund) => (
        <Stack
          direction="row"
          spacing={0.5}
          justifyContent="flex-end"
          onClick={(ev) => ev.stopPropagation()}
        >
          <Tooltip title="Chi tiết">
            <IconButton
              size="small"
              onClick={() => {
                const slug = activeOrganization?.slug || organizations.find(o => o.id === activeOrgId)?.slug || "hcmus";
                window.open(`/${slug}/donations/${fund.id}`, "_blank");
              }}
            >
              <LaunchOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Lượt quyên góp">
            <IconButton
              size="small"
              color="primary"
              onClick={() => {
                setDonationsTarget(fund);
                setDonationsPage(1);
                setDonationsSearchKeyword("");
                setKeywordInput("");
                setDonationsSearchBy("name");
                setDonationsDialogOpen(true);
              }}
            >
              <VolunteerActivismIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <IconButton
              size="small"
              onClick={() => {
                const slug = activeOrganization?.slug || organizations.find(o => o.id === activeOrgId)?.slug || "hcmus";
                navigate(`/${slug}/donations/${fund.id}/edit`);
              }}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {fund.status !== "COMPLETED" && (
            <Tooltip title="Đóng quỹ">
              <IconButton
                size="small"
                sx={{
                  color: "#f2cd3c",
                  "&:hover": {
                    backgroundColor: "rgba(242, 205, 60, 0.08)",
                  },
                }}
                onClick={() => setCloseTarget(fund)}
              >
                <LockOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
            Quản lý quyên góp
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: 500 }}
          >
            Giám sát các chiến dịch thiện nguyện, học bổng và quỹ phát triển
            sinh viên.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <TextField
            select
            size="small"
            label="Tổ chức"
            value={activeOrgId || ""}
            onChange={(e) => setActiveOrgId(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            {organizations.map((org) => (
              <MenuItem key={org.id} value={org.id}>
                {org.name}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={handleOpenCreateDialog}
          >
            Tạo chiến dịch
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          mb: 4,
          '& > *': {
            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 0' },
          },
        }}
      >
        <AdminDashboardMetricTile
          label="Tổng tiền quyên góp"
          value={formatCurrencyVnd(stats.totalRaised)}
          icon={<AccountBalanceWalletIcon />}
          valueColor="success.main"
        />
        <AdminDashboardMetricTile
          label="Chiến dịch đang chạy"
          value={stats.activeCampaigns}
          icon={<TrendingUpIcon />}
          valueColor="primary.main"
        />
        <AdminDashboardMetricTile
          label="Tổng lượt ủng hộ"
          value={stats.totalDonors}
          icon={<GroupIcon />}
        />
        <AdminDashboardMetricTile
          label="Tỷ lệ hoàn thành"
          value={`${stats.avgCompletion}%`}
          icon={<VolunteerActivismIcon />}
          valueColor="warning.main"
        />
      </Box>

      <AdminDataTable
        columns={columns}
        rows={fundraisings}
        totalCount={filteredCount}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(Number(e.target.value));
          setPage(0);
        }}
        onSearchChange={setSearch}
        onSearchKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submitSearch();
          }
        }}
        searchValue={search}
        searchPlaceholder="Tìm theo tên quỹ... (Enter để tìm)"
        onRowClick={(f) => setDetailItem(f)}
      />

      {/* Dialogs */}
      <Dialog
        open={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Chi tiết chiến dịch</DialogTitle>
        {detailItem && (
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography
                variant="h6"
                color="primary.main"
                sx={{ fontWeight: 700 }}
              >
                {detailItem.title}
              </Typography>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  Người phụ trách
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {detailItem.ownerName || "-"}
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    Mục tiêu
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {formatCurrencyVnd(detailItem.targetAmount)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    Đã đạt được
                  </Typography>
                  <Typography
                    variant="body2"
                    color="success.main"
                    sx={{ fontWeight: 700 }}
                  >
                    {formatCurrencyVnd(detailItem.raisedAmount)}
                  </Typography>
                </Grid>
              </Grid>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  Tiến độ
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      flexGrow: 1,
                      height: 8,
                      bgcolor: "divider",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        width: `${Math.min(100, (detailItem.raisedAmount / detailItem.targetAmount) * 100)}%`,
                        height: "100%",
                        bgcolor: "success.main",
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {(
                      (detailItem.raisedAmount / detailItem.targetAmount) *
                      100
                    ).toFixed(1)}
                    %
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  Cập nhật lần cuối
                </Typography>
                <Typography variant="body2">
                  {formatDateTime(detailItem.updatedAt)}
                </Typography>
              </Box>
            </Stack>
          </DialogContent>
        )}
        <DialogActions sx={{ p: 3 }}>
          <Button
            variant="outlined"
            onClick={() => setDetailItem(null)}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Đóng quỹ sớm (Admin Custom) */}
      <Dialog
        open={Boolean(closeTarget)}
        onClose={isClosing ? undefined : () => setCloseTarget(null)}
        disableScrollLock
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Xác nhận đóng quỹ sớm</DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          <Typography sx={{ color: "text.secondary", lineHeight: 1.7 }}>
            Bạn có chắc muốn đóng sớm quỹ{" "}
            <Box component="span" sx={{ color: "primary.main", fontWeight: 700 }}>
              {closeTarget?.title}
            </Box>{" "}
            không?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setCloseTarget(null)}
            variant="outlined"
            disabled={isClosing}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={async () => {
              if (!closeTarget) return;
              setIsClosing(true);
              try {
                await updateStatus(closeTarget.id, "COMPLETED");
                enqueueSnackbar("Đóng quỹ thành công.", { variant: "success" });
              } catch (err) {
                const errorMsg = err?.response?.data?.message || "Đóng quỹ thất bại.";
                enqueueSnackbar(errorMsg, { variant: "error" });
              } finally {
                setIsClosing(false);
                setCloseTarget(null);
              }
            }}
            variant="contained"
            color="error"
            disabled={isClosing}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Đóng quỹ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Tạo quỹ quyên góp mới */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        fullWidth
        maxWidth="md"
        scroll="paper"
        PaperProps={{
          sx: {
            p: { xs: 2.5, md: 4 },
            borderRadius: 3,
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.08)",
          }
        }}
      >
        <DialogTitle sx={{ px: 0, pt: 0, pb: 3 }}>
          <Typography variant="h4" component="h2" fontWeight={700}>
            Tạo bài đăng quyên góp
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 0, py: 0 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box
              component="form"
              onSubmit={handleCreateFund}
              noValidate
            >
              <Box
                sx={{
                  mb: 3.5,
                }}
              >
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>
                  Thông tin quỹ quyên góp
                </Typography>
                
                {/* 1. Chọn Tổ chức */}
                <FormControl fullWidth sx={{ mb: 2.5 }}>
                  <InputLabel id="org-label">Tổ chức</InputLabel>
                  <Select
                    labelId="org-label"
                    label="Tổ chức"
                    value={createForm.organizationId || ""}
                    onChange={(e) => handleInputChange("organizationId", e.target.value)}
                    MenuProps={{ disableScrollLock: true }}
                  >
                    {organizations.map((org) => (
                      <MenuItem key={org.id} value={org.id}>
                        {org.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* 2. Tên quỹ quyên góp */}
                <TextField
                  fullWidth
                  label="Tên quỹ quyên góp"
                  placeholder="Nhập tên quỹ quyên góp"
                  value={createForm.fundName}
                  onChange={(e) => handleInputChange("fundName", e.target.value)}
                  sx={{
                    mb: 2.5,
                    "& .MuiInputBase-input": {
                      fontSize: "1.05rem",
                      fontWeight: 600,
                    },
                  }}
                />

                {/* 3. Người tổ chức & Logo URL */}
                <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Người tổ chức"
                      placeholder="Nhập tên người tổ chức"
                      value={createForm.organizer}
                      onChange={(e) => handleInputChange("organizer", e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Logo URL"
                      placeholder="https://example.com/logo.png"
                      value={createForm.logoUrl}
                      onChange={(e) => handleInputChange("logoUrl", e.target.value)}
                    />
                  </Grid>
                </Grid>

                {/* 4. Trạng thái & Tài khoản nhận quỹ */}
                <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel id="status-label">Trạng thái</InputLabel>
                      <Select
                        labelId="status-label"
                        label="Trạng thái"
                        value={createForm.statusId || ""}
                        onChange={(e) => handleInputChange("statusId", Number(e.target.value))}
                        MenuProps={{ disableScrollLock: true }}
                      >
                        {statusOptions.map((option) => (
                          <MenuItem key={option.id} value={option.id}>
                            {option.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel id="fund-receiving-info-label">Tài khoản nhận quỹ</InputLabel>
                      <Select
                        labelId="fund-receiving-info-label"
                        label="Tài khoản nhận quỹ"
                        value={createForm.fundReceivingInfoId || ""}
                        onChange={(e) => handleInputChange("fundReceivingInfoId", Number(e.target.value))}
                        MenuProps={{ disableScrollLock: true }}
                      >
                        {receivingOptions.map((option) => (
                          <MenuItem key={option.id} value={option.id}>
                            {`${option.bankName} - ${option.accountName} - ${option.accountNumber}`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* 5. Số tiền mục tiêu */}
                <TextField
                  fullWidth
                  label="Số tiền mục tiêu để quyên góp (VNĐ)"
                  placeholder="Nhập số tiền mục tiêu"
                  type="number"
                  value={createForm.targetAmount}
                  onChange={(e) => handleInputChange("targetAmount", e.target.value)}
                  sx={{ mb: 2.5 }}
                />

                {/* 6. Mô tả ngắn */}
                <TextField
                  fullWidth
                  label="Mô tả ngắn (tối đa 120 ký tự)"
                  placeholder="Nhập mô tả ngắn"
                  inputProps={{ maxLength: 120 }}
                  value={createForm.descriptionShort}
                  onChange={(e) => handleInputChange("descriptionShort", e.target.value)}
                  sx={{ mb: 2.5 }}
                />

                {/* 7. Mô tả chi tiết */}
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Mô tả"
                  placeholder="Nhập mô tả"
                  value={createForm.descriptionFull}
                  onChange={(e) => handleInputChange("descriptionFull", e.target.value)}
                  sx={{ mb: 2.5 }}
                />

                {/* 8. Thời gian bắt đầu & Thời gian kết thúc */}
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DateTimePicker
                      label="Thời gian bắt đầu"
                      value={createForm.startDate}
                      onChange={(val) => handleInputChange("startDate", val)}
                      views={["year", "month", "day", "hours", "minutes", "seconds"]}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DateTimePicker
                      label="Thời gian kết thúc"
                      value={createForm.endDate}
                      onChange={(val) => handleInputChange("endDate", val)}
                      views={["year", "month", "day", "hours", "minutes", "seconds"]}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ px: 0, pb: 0, pt: 3, justifyContent: "flex-end", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setCreateDialogOpen(false)}
            sx={{
              px: 4,
              py: 1,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="contained"
            onClick={handleCreateFund}
            disabled={isSubmitting}
            sx={{
              px: 4,
              py: 1,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Đăng
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG DANH SÁCH LƯỢT QUYÊN GÓP */}
      {/* ========================================================================= */}
      <Dialog
        open={donationsDialogOpen}
        onClose={() => setDonationsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 4,
            backgroundImage: "none",
            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
          },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary" }}>
            Danh sách lượt quyên góp
          </Typography>
          <IconButton onClick={() => setDonationsDialogOpen(false)}>
            <CloseOutlinedIcon />
          </IconButton>
        </Box>

        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.secondary", mb: 3 }}>
          Chiến dịch: <span style={{ color: "#1976d2" }}>{donationsTarget?.title || ""}</span>
        </Typography>

        <DialogContent dividers sx={{ px: 0, py: 3, borderTop: "1px solid #e0e0e0", borderBottom: "1px solid #e0e0e0" }}>
          {/* Tìm kiếm & Bộ lọc */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }} alignItems="center">
            <TextField
              size="small"
              label="Từ khóa tìm kiếm"
              placeholder="Nhập tên, số điện thoại..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setDonationsPage(1);
                  setDonationsSearchKeyword(keywordInput);
                }
              }}
              sx={{ flexGrow: 1 }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />,
              }}
            />
            <TextField
              select
              size="small"
              label="Tìm kiếm theo"
              value={donationsSearchBy}
              onChange={(e) => setDonationsSearchBy(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="name">Tên người ủng hộ</MenuItem>
              <MenuItem value="phone">Số điện thoại</MenuItem>
              <MenuItem value="email">Email</MenuItem>
            </TextField>
            <Button
              variant="contained"
              onClick={() => {
                setDonationsPage(1);
                setDonationsSearchKeyword(keywordInput);
              }}
              sx={{ borderRadius: 2, fontWeight: 700, px: 3, py: 1, textTransform: "none" }}
            >
              Tìm kiếm
            </Button>
          </Stack>

          {donationsLoading ? (
            <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
              <Typography variant="body1" sx={{ color: "text.secondary", fontWeight: 500 }}>
                Đang tải danh sách lượt quyên góp...
              </Typography>
            </Box>
          ) : donationsList.length === 0 ? (
            <Box sx={{ py: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <VolunteerActivismIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
              <Typography variant="body1" sx={{ color: "text.secondary", fontWeight: 600 }}>
                Chưa có lượt quyên góp nào phù hợp.
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden" }}>
                <Table>
                  <TableHead sx={{ backgroundColor: "grey.50" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Nhà hảo tâm</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Số điện thoại</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Địa chỉ</TableCell>
                      <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Số tiền ủng hộ</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Lời nhắn</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Thời gian</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {donationsList.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ fontWeight: 600, color: "text.primary" }}>
                          {item.donorName || "Nhà hảo tâm"}
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary" }}>{item.phone || "--"}</TableCell>
                        <TableCell sx={{ color: "text.secondary" }}>{item.email || "--"}</TableCell>
                        <TableCell sx={{ color: "text.secondary" }}>{item.address || "--"}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "success.main", textAlign: "right" }}>
                          {formatCurrencyVnd(item.amount)}
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary", fontStyle: item.message ? "normal" : "italic", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.message}>
                          {item.message || "--"}
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary" }}>
                          {formatDateTime(item.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
                <Pagination
                  count={donationsTotalPages}
                  page={donationsPage}
                  onChange={(_, value) => setDonationsPage(value)}
                  color="primary"
                  shape="rounded"
                  size="medium"
                  sx={{ "& .MuiPaginationItem-root": { fontWeight: 700 } }}
                />
              </Stack>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 0, pt: 3, pb: 0, justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            onClick={() => setDonationsDialogOpen(false)}
            sx={{ px: 4, py: 1, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminFundraisingsPage;
