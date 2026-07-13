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
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { useAdminSystemContext } from "../../stores/AdminStore";
import { fundApi } from "../../utils/api";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";

import AdminStatusChip from "../../components/admin/AdminStatusChip";
import AdminDashboardMetricTile from "../../components/admin/AdminDashboardMetricTile";
import AdminDataTable from "../../components/admin/AdminDataTable";
import useAdminFundraisingsData from "../../hooks/admin/useAdminFundraisingsData";
import { formatDateTime } from "../../utils/dateFormatter";
import { formatCurrencyVnd } from "../../utils/numberFormatter";
import { useDebounce } from "../../hooks/useDebounce";
import { exportToCSV } from "../../utils/exportUtils";

const isFundActive = (fund, getFundPhase) => getFundPhase(fund.timeStarted, fund.timeEnded).status === "ACTIVE";

const AdminFundraisingsPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation("admin");
  const { setBreadcrumbs } = useOutletContext();
  const { stableOrgId, activeOrganization } = useAdminSystemContext();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  // Trạng thái quỹ được suy ra hoàn toàn từ thời gian bắt đầu/kết thúc.
  const getFundPhase = (timeStarted, timeEnded) => {
    const now = Date.now();
    const start = timeStarted ? new Date(timeStarted).getTime() : null;
    const end = timeEnded ? new Date(timeEnded).getTime() : null;
    if (start && now < start) return { status: "UPCOMING", label: t('fund_phase_upcoming') };
    if (end && now > end) return { status: "ENDED", label: t('fund_phase_ended') };
    return { status: "ACTIVE", label: t('fund_phase_active') };
  };

  const getOrgSlug = () => activeOrganization?.slug || "hcmus";

  useEffect(() => {
    setBreadcrumbs?.([{ label: t('fund_management_breadcrumb'), active: true }]);
  }, [setBreadcrumbs, t]);

  const {
    fundraisings,
    filteredCount,
    setSearch,
    updateSearchQuery,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    sortOrder,
    setSortOrder,
    closeFundById,
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
  const [isExporting, setIsExporting] = useState(false);

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
      enqueueSnackbar(t('fund_donations_load_error'), { variant: "error" });
      setDonationsList([]);
    } finally {
      setDonationsLoading(false);
    }
  };

  const handleExportDonationsCsv = async () => {
    const fundId = donationsTarget?.id;
    if (!fundId) return;

    setIsExporting(true);
    try {
      const donations = await fundApi.getAllFundDonationsForExport(fundId);
      if (!donations.length) {
        enqueueSnackbar(t('fund_export_empty'), { variant: "warning" });
        return;
      }

      const exportData = donations.map((item) => ({
        [t('fund_donor_name')]: item.donorName,
        [t('fund_donor_phone')]: item.phone || "",
        Email: item.email || "",
        [t('fund_donor_address')]: item.address || "",
        [t('fund_donor_amount')]: formatCurrencyVnd(item.amount),
        [t('fund_donor_message')]: item.message || "",
        [t('fund_donor_time')]: formatDateTime(item.createdAt),
        [t('fund_donor_status')]: item.status || "",
      }));

      exportToCSV(exportData, `donations_${fundId}_${Date.now()}.csv`);
      enqueueSnackbar(t('fund_export_success'), { variant: "success" });
    } catch {
      enqueueSnackbar(t('fund_export_failed'), { variant: "error" });
    } finally {
      setIsExporting(false);
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
    activeCampaigns: fundraisings.filter((f) => isFundActive(f, getFundPhase)).length,
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
      label: t('fund_col_title'),
      render: (val) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {val}
        </Typography>
      ),
    },
    { id: "ownerName", label: t('fund_col_owner'), render: (val) => val || "-" },
    {
      id: "status",
      label: t('fund_col_status'),
      render: (_, fund) => {
        const phase = getFundPhase(fund.timeStarted, fund.timeEnded);
        return (
          <AdminStatusChip
            status={phase.status}
            category="fundraising"
            label={phase.label}
          />
        );
      },
    },
    {
      id: "targetAmount",
      label: t('fund_col_target'),
      align: "right",
      render: (val) => formatCurrencyVnd(val),
    },
    {
      id: "raisedAmount",
      label: t('fund_col_raised'),
      align: "right",
      render: (val) => (
        <Typography
          variant="body2"
          color="primary.main"
          sx={{ fontWeight: 700 }}
        >
          {formatCurrencyVnd(val)}
        </Typography>
      ),
    },
    { id: "donorCount", label: t('fund_col_donors'), align: "right" },
    {
      id: "updatedAt",
      label: t('fund_col_updated_at'),
      render: (val) => formatDateTime(val),
    },
    {
      id: "actions",
      label: t('col_actions'),
      align: "right",
      render: (_, fund) => (
        <Stack
          direction="row"
          spacing={0.5}
          justifyContent="flex-end"
          onClick={(ev) => ev.stopPropagation()}
        >
          <Tooltip title={t('fund_action_detail')}>
            <IconButton
              size="small"
              sx={{ color: "primary.main" }}
              onClick={() => {
                window.open(`/${getOrgSlug()}/donations/${fund.id}`, "_blank");
              }}
            >
              <LaunchOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('fund_action_donations')}>
            <IconButton
              size="small"
              sx={{ color: "accent.main" }}
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
          <Tooltip title={t('fund_action_edit')}>
            <IconButton
              size="small"
              onClick={() => {
                window.open(`/${getOrgSlug()}/donations/${fund.id}/edit`, "_blank", "noopener,noreferrer");
              }}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {isAdmin && (
            getFundPhase(fund.timeStarted, fund.timeEnded).status !== "ENDED" ? (
              <Tooltip title={t('fund_action_close')}>
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
            ) : (
              <IconButton size="small" disabled sx={{ visibility: "hidden" }}>
                <LockOutlinedIcon fontSize="small" />
              </IconButton>
            )
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
            {t('fund_page_title')}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: 500 }}
          >
            {t('fund_page_subtitle')}
          </Typography>
        </Box>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={() => navigate(`/${getOrgSlug()}/post/donation`)}
          >
            {t('fund_btn_create')}
          </Button>
        )}
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
          label={t('fund_stat_total_raised')}
          value={formatCurrencyVnd(stats.totalRaised)}
          icon={<AccountBalanceWalletIcon />}
          valueColor="primary.main"
        />
        <AdminDashboardMetricTile
          label={t('fund_stat_active')}
          value={stats.activeCampaigns}
          icon={<TrendingUpIcon />}
          valueColor="primary.main"
        />
        <AdminDashboardMetricTile
          label={t('fund_stat_total_donors')}
          value={stats.totalDonors}
          icon={<GroupIcon />}
        />
        <AdminDashboardMetricTile
          label={t('fund_stat_completion')}
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
        searchPlaceholder={t('fund_search_placeholder')}
        onRowClick={(f) => setDetailItem(f)}
        filters={
          <TextField
            select
            size="small"
            label={t('filter_sort_label')}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="DESC">{t('sort_newest')}</MenuItem>
            <MenuItem value="ASC">{t('sort_oldest')}</MenuItem>
          </TextField>
        }
      />

      {/* Dialogs */}
      <Dialog
        open={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>{t('fund_detail_title')}</DialogTitle>
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
                  {t('fund_detail_owner')}
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
                    {t('fund_col_target')}
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
                    {t('fund_detail_raised')}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="primary.main"
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
                  {t('fund_detail_progress')}
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
                        bgcolor: "primary.main",
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
                  {t('fund_detail_last_updated')}
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
            {t('fund_btn_close')}
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
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>{t('fund_close_dialog_title')}</DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          <Typography sx={{ color: "text.secondary", lineHeight: 1.7 }}>
            {t('fund_close_dialog_body_prefix')}{" "}
            <Box component="span" sx={{ color: "primary.main", fontWeight: 700 }}>
              {closeTarget?.title}
            </Box>{" "}
            {t('fund_close_dialog_body_suffix')}
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
            {t('fund_btn_cancel')}
          </Button>
          <Button
            onClick={async () => {
              if (!closeTarget) return;
              setIsClosing(true);
              try {
                await closeFundById(closeTarget.id);
                enqueueSnackbar(t('fund_close_success'), { variant: "success" });
              } catch (err) {
                const errorMsg = err?.response?.data?.message || t('fund_close_failed');
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
            {t('fund_btn_close_fund')}
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
            {t('fund_donations_dialog_title')}
          </Typography>
          <IconButton onClick={() => setDonationsDialogOpen(false)}>
            <CloseOutlinedIcon />
          </IconButton>
        </Box>

        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.secondary", mb: 3 }}>
          {t('fund_donations_dialog_fund_label')}: <Box component="span" sx={{ color: "primary.main", fontWeight: 600 }}>{donationsTarget?.title || ""}</Box>
        </Typography>

        <DialogContent dividers sx={{ px: 0, py: 3, borderTop: "1px solid #e0e0e0", borderBottom: "1px solid #e0e0e0" }}>
          {/* Tìm kiếm & Bộ lọc */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }} alignItems="center">
            <TextField
              size="small"
              label={t('fund_search_keyword_label')}
              placeholder={t('fund_search_keyword_placeholder')}
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
              label={t('fund_search_by_label')}
              value={donationsSearchBy}
              onChange={(e) => setDonationsSearchBy(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="name">{t('fund_search_by_name')}</MenuItem>
              <MenuItem value="phone">{t('fund_search_by_phone')}</MenuItem>
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
              {t('fund_btn_search')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={handleExportDonationsCsv}
              disabled={isExporting}
              sx={{ borderRadius: 2, fontWeight: 700, px: 3, py: 1, textTransform: "none", flexShrink: 0 }}
            >
              {isExporting ? t('fund_btn_exporting') : t('fund_btn_export_csv')}
            </Button>
          </Stack>

          {donationsLoading ? (
            <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
              <Typography variant="body1" sx={{ color: "text.secondary", fontWeight: 500 }}>
                {t('fund_donations_loading')}
              </Typography>
            </Box>
          ) : donationsList.length === 0 ? (
            <Box sx={{ py: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <VolunteerActivismIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
              <Typography variant="body1" sx={{ color: "text.secondary", fontWeight: 600 }}>
                {t('fund_donations_empty')}
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden" }}>
                <Table>
                  <TableHead sx={{ backgroundColor: "grey.50" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>{t('fund_col_donor')}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t('fund_col_phone')}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t('fund_col_email')}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t('fund_col_address')}</TableCell>
                      <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>{t('fund_col_amount')}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t('fund_col_message')}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t('fund_col_time')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {donationsList.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ fontWeight: 600, color: "text.primary" }}>
                          {item.donorName}
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary" }}>{item.phone || "--"}</TableCell>
                        <TableCell sx={{ color: "text.secondary" }}>{item.email || "--"}</TableCell>
                        <TableCell sx={{ color: "text.secondary" }}>{item.address || "--"}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "primary.main", textAlign: "right" }}>
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
            variant="outlined"
            color="secondary"
            onClick={() => setDonationsDialogOpen(false)}
            sx={{ px: 4, py: 1, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
          >
            {t('fund_btn_close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminFundraisingsPage;
