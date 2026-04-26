import { useMemo, useState } from "react";
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
import Page from "../../components/Page";
import { useAuth } from "../../hooks/useAuth";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";
import { truncateText } from "../../utils/text";

const FILTER_OPTIONS = {
  category: [
    { value: "all", label: "Tất cả" },
    { value: "important", label: "Quan trọng" },
    { value: "remote", label: "Vùng sâu vùng xa" },
  ],
  trending: [
    { value: "none", label: "No" },
    { value: "asc", label: "ASC" },
    { value: "desc", label: "DESC" },
  ],
};

const CAMPAIGNS = [
  {
    id: 1,
    category: "important",
    title: "Nâng bước em đến trường",
    organization: "Quỹ Cựu sinh viên CNTT",
    donationCount: 186,
    startDate: "2026-04-08",
    endDate: "2026-05-20",
    amount: 1200000,
    currentAmount: 1200000,
    targetAmount: 5000000,
    description: "Hỗ trợ học phí, sách vở và chi phí sinh hoạt cho học sinh vùng ven đô.",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    category: "important",
    title: "Thiết bị học tập cho vùng lũ",
    organization: "AlumVerse Foundation",
    donationCount: 142,
    startDate: "2026-04-15",
    endDate: "2026-06-15",
    amount: 2200000,
    currentAmount: 2200000,
    targetAmount: 7000000,
    description: "Trao tặng laptop, máy tính bảng và kết nối internet cho trường học khó khăn.",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    category: "important",
    title: "Học bổng nữ sinh STEM",
    organization: "Mạng lưới Alumni STEM",
    donationCount: 231,
    startDate: "2026-04-03",
    endDate: "2026-06-30",
    amount: 4500000,
    currentAmount: 4500000,
    targetAmount: 10000000,
    description: "Khuyến khích và trao cơ hội học tập cho nữ sinh theo đuổi khoa học công nghệ aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 4,
    category: "remote",
    title: "Nước sạch cho bản cao",
    organization: "Nhóm Cựu sinh viên Môi trường",
    donationCount: 95,
    startDate: "2026-04-12",
    endDate: "2026-05-28",
    amount: 800000,
    currentAmount: 800000,
    targetAmount: 3000000,
    description: "Lắp đặt bể lọc và hệ thống cấp nước sạch cho các điểm trường vùng cao.",
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 5,
    category: "remote",
    title: "Bữa ăn ấm cho trẻ em vùng sâu",
    organization: "Alumni for Community",
    donationCount: 168,
    startDate: "2026-04-05",
    endDate: "2026-05-30",
    amount: 600000,
    currentAmount: 600000,
    targetAmount: 2500000,
    description: "Đảm bảo dinh dưỡng và bữa ăn đủ chất cho học sinh ở các xã đặc biệt khó khăn.",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 6,
    category: "remote",
    title: "Ánh sáng đến vùng biên",
    organization: "Câu lạc bộ Kỹ sư Alumni",
    donationCount: 117,
    startDate: "2026-04-20",
    endDate: "2026-06-25",
    amount: 1750000,
    currentAmount: 1750000,
    targetAmount: 4500000,
    description: "Triển khai hệ thống điện năng lượng mặt trời cho điểm trường chưa có điện lưới.",
    image: "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&w=800&q=80",
  },
];

const ADMIN_BANNER_MOCK_DATA = {
  totalFundRaised: "595,375,229 VND",
  openFundCount: "10",
  donationCount: "4,205",
  currentMonthTotalAmount: "4,294,243 VND",
};

const CAMPAIGN_DESCRIPTION_MAX_CHARS = 120;

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value ?? 0));
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
      <CardMedia component="img" image={campaign.image} alt={campaign.title} sx={{ height: 170, width: "100%" }} />
      <CardContent sx={{ p: 2.2, display: "flex", flexDirection: "column", gap: 0.9, minWidth: 0, height: 300 }}>
        <Typography variant="caption" sx={{ color: "#5c75a4", fontWeight: 600 }}>
          {`${campaign.startDate} - ${campaign.endDate}`}
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
          {campaign.title}
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
          {campaign.organization}
        </Typography>
        <Typography sx={{ color: "#6480b2", fontSize: "0.86rem" }}>
          {campaign.donationCount} người đã quyên góp
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
          {truncateText(campaign.description, CAMPAIGN_DESCRIPTION_MAX_CHARS)}
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
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "ADMIN";
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    date: "",
    trending: "none",
    minAmount: "",
    maxAmount: "",
  });
  const [page, setPage] = useState(1);
  const [amountAnchorEl, setAmountAnchorEl] = useState(null);
  const [closeDialogCampaign, setCloseDialogCampaign] = useState(null);
  const amountMenuOpen = Boolean(amountAnchorEl);
  const closeDialogOpen = Boolean(closeDialogCampaign);
  const pageSize = 6;

  const handleFilterChange = (key) => (event) => {
    setFilters((prev) => ({ ...prev, [key]: event.target.value }));
    setPage(1);
  };

  const filteredCampaigns = useMemo(() => {
    const minAmount = Number(filters.minAmount);
    const maxAmount = Number(filters.maxAmount);
    const normalizedSearch = search.trim().toLowerCase();

    let result = CAMPAIGNS.filter((campaign) => {
      const matchesCategory = filters.category === "all" || campaign.category === filters.category;
      const matchesDate = !filters.date || campaign.startDate <= filters.date;
      const matchesSearch =
        !normalizedSearch ||
        campaign.title.toLowerCase().includes(normalizedSearch) ||
        campaign.organization.toLowerCase().includes(normalizedSearch);
      const matchesMin = Number.isNaN(minAmount) || minAmount <= 0 || campaign.amount >= minAmount;
      const matchesMax = Number.isNaN(maxAmount) || maxAmount <= 0 || campaign.amount <= maxAmount;

      return matchesCategory && matchesDate && matchesSearch && matchesMin && matchesMax;
    });

    if (filters.trending === "asc") {
      result = [...result].sort((a, b) => a.donationCount - b.donationCount);
    } else if (filters.trending === "desc") {
      result = [...result].sort((a, b) => b.donationCount - a.donationCount);
    }

    return result;
  }, [filters, search]);

  const pageCount = Math.ceil(filteredCampaigns.length / pageSize);
  const paginatedCampaigns = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredCampaigns.slice(startIndex, startIndex + pageSize);
  }, [filteredCampaigns, page]);

  const amountButtonLabel = useMemo(() => {
    const { minAmount, maxAmount } = filters;
    if (!minAmount && !maxAmount) return "Mức quyên góp";
    return `${minAmount || 0} - ${maxAmount || "∞"}`;
  }, [filters]);

  const handleOpenCloseDialog = (campaign) => {
    setCloseDialogCampaign(campaign);
  };

  const handleCloseDialog = () => {
    setCloseDialogCampaign(null);
  };

  const handleConfirmCloseFund = () => {
    // TODO: Call close-fund API when backend endpoint is ready.
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

          <Stack direction="row" spacing={1.2} flexWrap="wrap" sx={{ mb: 2.2, rowGap: 1.2 }}>
            <FilterDropdown
              label="Status"
              value={filters.category}
              onChange={handleFilterChange("category")}
              options={FILTER_OPTIONS.category}
            />
            <FilterDropdown
              label="Thịnh hành"
              value={filters.trending}
              onChange={handleFilterChange("trending")}
              options={FILTER_OPTIONS.trending}
            />
            <TextField
              label="Ngày diễn ra"
              type="date"
              size="small"
              value={filters.date}
              onChange={handleFilterChange("date")}
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
                  value={filters.minAmount}
                  onChange={handleFilterChange("minAmount")}
                  placeholder="0"
                />
                <TextField
                  label="Max"
                  size="small"
                  type="number"
                  value={filters.maxAmount}
                  onChange={handleFilterChange("maxAmount")}
                  placeholder="0"
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, minAmount: "", maxAmount: "" }));
                      setPage(1);
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
          </Stack>

          <TextField
            fullWidth
            placeholder="Tìm kiếm chiến dịch quyên góp..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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

          {isAdmin && (
            <Box sx={{ mb: 2.8 }}>
              <StatsSummaryBar
                items={[
                  { value: ADMIN_BANNER_MOCK_DATA.totalFundRaised, label: "tổng quỹ gây được" },
                  { value: ADMIN_BANNER_MOCK_DATA.openFundCount, label: "quỹ đang mở" },
                  { value: ADMIN_BANNER_MOCK_DATA.donationCount, label: "người quyên góp" },
                  { value: ADMIN_BANNER_MOCK_DATA.currentMonthTotalAmount, label: "tổng quỹ tháng" },
                ]}
              />
            </Box>
          )}

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
            {paginatedCampaigns.map((campaign) => (
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
                  {closeDialogCampaign?.title}
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