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
import { fundApi } from "../../utils/api";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import SearchIcon from "@mui/icons-material/Search";

import AdminStatusChip from "../../components/admin/AdminStatusChip";
import AdminDashboardMetricTile from "../../components/admin/AdminDashboardMetricTile";
import AdminDataTable from "../../components/admin/AdminDataTable";
import useAdminFundraisingsData from "../../hooks/admin/useAdminFundraisingsData";
import { formatDateTime } from "../../utils/dateFormatter";
import { formatCurrencyVnd } from "../../utils/numberFormatter";
import { useDebounce } from "../../hooks/useDebounce";

const AdminFundraisingsPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { setBreadcrumbs } = useOutletContext();
  const { stableOrgId, activeOrganization } = useAdminSystemContext();

  const getOrgSlug = () => activeOrganization?.slug || "hcmus";

  useEffect(() => {
    setBreadcrumbs?.([{ label: "Quản lý gây quỹ", active: true }]);
  }, [setBreadcrumbs]);

  const {
    fundraisings,
    filteredCount,
    setSearch,
    updateSearchQuery,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    updateStatus,
  } = useAdminFundraisingsData(stableOrgId);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearch === searchQuery) return;
    setSearchQuery(debouncedSearch);
    setSearch(debouncedSearch);
    updateSearchQuery(debouncedSearch);
  }, [debouncedSearch, searchQuery, setSearch, updateSearchQuery]);

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
                window.open(`/${getOrgSlug()}/donations/${fund.id}`, "_blank");
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
                navigate(`/${getOrgSlug()}/donations/${fund.id}/edit`);
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
        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          onClick={() => navigate(`/${getOrgSlug()}/post/donation`)}
        >
          Tạo chiến dịch
        </Button>
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
        onSearchChange={setSearchTerm}
        searchValue={searchTerm}
        searchPlaceholder="Tìm theo tên quỹ..."
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
