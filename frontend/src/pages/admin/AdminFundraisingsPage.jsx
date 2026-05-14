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
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import GroupIcon from "@mui/icons-material/Group";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

import AdminStatusChip from "../../components/admin/AdminStatusChip";
import AdminDashboardMetricTile from "../../components/admin/AdminDashboardMetricTile";
import AdminConfirmDeleteDialog from "../../components/admin/AdminConfirmDeleteDialog";
import AdminDataTable from "../../components/admin/AdminDataTable";
import { ADMIN_FUNDRAISING_STATUS_OPTIONS } from "../../constants/adminDefaultFundraisings";
import useAdminFundraisingsData from "../../hooks/admin/useAdminFundraisingsData";
import { formatDateTime } from "../../utils/dateFormatter";
import { formatCurrencyVnd } from "../../utils/numberFormatter";

const AdminFundraisingsPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { setBreadcrumbs } = useOutletContext();

  useEffect(() => {
    setBreadcrumbs?.([{ label: "Quản lý gây quỹ", active: true }]);
  }, [setBreadcrumbs]);

  const {
    fundraisings,
    filteredCount,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    updateStatus,
    deleteItem,
  } = useAdminFundraisingsData();

  const [detailItem, setDetailItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

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
            <IconButton size="small" onClick={() => setDetailItem(fund)}>
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Kích hoạt">
            <IconButton
              size="small"
              color="success"
              onClick={() => {
                updateStatus(fund.id, "ACTIVE");
                enqueueSnackbar("Đã kích hoạt chiến dịch.", {
                  variant: "success",
                });
              }}
            >
              <CheckCircleOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Tạm dừng">
            <IconButton
              size="small"
              color="warning"
              onClick={() => {
                updateStatus(fund.id, "PAUSED");
                enqueueSnackbar("Đã tạm dừng chiến dịch.", {
                  variant: "warning",
                });
              }}
            >
              <PauseCircleOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xóa">
            <IconButton
              size="small"
              color="error"
              onClick={() => setDeleteTarget(fund)}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const Filters = (
    <TextField
      select
      size="small"
      label="Trạng thái"
      value={statusFilter}
      onChange={(e) => {
        setStatusFilter(e.target.value);
        setPage(0);
      }}
      sx={{ minWidth: 160 }}
    >
      {ADMIN_FUNDRAISING_STATUS_OPTIONS.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>
          {opt.label}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: "space-between",
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -1 }}>
            Quản lý gây quỹ
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
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(Number(e.target.value));
          setPage(0);
        }}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(0);
        }}
        searchValue={search}
        filters={Filters}
        onRowClick={(f) => setDetailItem(f)}
        addButton={
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none" }}
          >
            Tạo chiến dịch
          </Button>
        }
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

      <AdminConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Xóa chiến dịch"
        description={
          deleteTarget
            ? `Bạn có chắc chắn muốn xóa chiến dịch "${deleteTarget.title}"?`
            : ""
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteItem(deleteTarget.id);
            enqueueSnackbar("Đã xóa chiến dịch.", { variant: "success" });
          }
          setDeleteTarget(null);
        }}
      />
    </Box>
  );
};

export default AdminFundraisingsPage;
