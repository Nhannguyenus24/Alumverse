import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  Container,
  Grid,
  MenuItem,
  TextField,
  Typography,
  Avatar,
  Badge,
  Stack,
  InputAdornment,
  Pagination,
  LinearProgress,
} from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import styled from "@emotion/styled";
import SearchIcon from "@mui/icons-material/Search";
import { Controller, useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { z } from "zod";
import Page from "../../components/Page";
import { useAuth } from "../../hooks/useAuth";

const donationSchema = z
  .object({
    amountOption: z.string().min(1, "Vui lòng chọn số tiền"),
    customAmount: z.coerce.number().optional(),
    donorName: z.string().min(1, "Vui lòng nhập họ và tên/tổ chức"),
    email: z.string().min(1, "Vui lòng nhập email").email("Email không đúng định dạng"),
    phone: z.string().regex(/^\d{10,11}$/, "Số điện thoại phải gồm 10-11 chữ số"),
    address: z.string().min(1, "Vui lòng nhập địa chỉ"),
    message: z
      .string()
      .min(1, "Vui lòng nhập lời nhắn nhủ")
      .max(100, "Lời nhắn nhủ tối đa 100 ký tự"),
  })
  .superRefine((data, ctx) => {
    if (data.amountOption === "custom") {
      if (!data.customAmount || Number.isNaN(data.customAmount) || data.customAmount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customAmount"],
          message: "Vui lòng nhập số tiền hợp lệ lớn hơn 0",
        });
      }
    }
  });

const DONATION_DETAIL = {
  logo: "https://placehold.co/220x220/eef3ff/0f3a7a?text=HCMUS",
  title: "Quỹ Cộng đồng Cựu sinh viên Khoa học",
  author: "Giáo vụ",
  managerName: "Nguyễn Thanh Hương",
  fundStatus: "Quan trọng",
  createdAt: "2026-01-21T08:00:00",
  startDate: "2026-01-21",
  endDate: "2026-01-24",
  category: "Giáo vụ",
  currentAmount: 258000000,
  targetAmount: 500000000,
  description:
    "Quỹ được thành lập nhằm hỗ trợ sinh viên có hoàn cảnh khó khăn, tài trợ học bổng, và thúc đẩy các hoạt động học thuật có giá trị cho cộng đồng cựu sinh viên. Song song đó, quỹ còn đồng hành cùng các chương trình hướng nghiệp, mentoring và các dự án liên ngành nhằm tăng khả năng tiếp cận cơ hội học tập chất lượng cho người học. Trong giai đoạn hiện tại, quỹ ưu tiên các hạng mục thiết thực như hỗ trợ học phí, trang thiết bị học tập, và chi phí nghiên cứu thực nghiệm cho những đề tài có tác động xã hội rõ rệt. Quỹ được thành lập nhằm hỗ trợ sinh viên có hoàn cảnh khó khăn, tài trợ học bổng, và thúc đẩy các hoạt động học thuật có giá trị cho cộng đồng cựu sinh viên. Song song đó, quỹ còn đồng hành cùng các chương trình hướng nghiệp, mentoring và các dự án liên ngành nhằm tăng khả năng tiếp cận cơ hội học tập chất lượng cho người học. Quỹ được thành lập nhằm hỗ trợ sinh viên có hoàn cảnh khó khăn, tài trợ học bổng, và thúc đẩy các hoạt động học thuật có giá trị cho cộng đồng cựu sinh viên. Song song đó, quỹ còn đồng hành cùng các chương trình hướng nghiệp, mentoring và các dự án liên ngành nhằm tăng khả năng tiếp cận cơ hội học tập chất lượng cho người học. Trong giai đoạn hiện tại, quỹ ưu tiên các hạng mục thiết thực như hỗ trợ học phí, trang thiết bị học tập, và chi phí nghiên cứu thực nghiệm cho những đề tài có tác động xã hội rõ rệt. Quỹ được thành lập nhằm hỗ trợ sinh viên có hoàn cảnh khó khăn, tài trợ học bổng, và thúc đẩy các hoạt động học thuật có giá trị cho cộng đồng cựu sinh viên. Song song đó, quỹ còn đồng hành cùng các chương trình hướng nghiệp, mentoring và các dự án liên ngành nhằm tăng khả năng tiếp cận cơ hội học tập chất lượng cho người học.",
  donorCount: 57000000,
  averageDonation: 1084920000,
  content: [
    "Cộng đồng Cựu sinh viên Khoa học được hình thành từ tinh thần kết nối tri thức và trách nhiệm xã hội. Quỹ được xây dựng nhằm hỗ trợ sinh viên có hoàn cảnh khó khăn, đồng thời tạo điều kiện cho các hoạt động học thuật, nghiên cứu và phát triển kỹ năng.",
    "Trong nhiều năm qua, sự đóng góp từ các cựu sinh viên đã giúp hàng trăm bạn trẻ có thêm cơ hội tiếp cận giáo dục chất lượng. Không chỉ dừng ở hỗ trợ tài chính, quỹ còn góp phần thúc đẩy các chương trình mentoring, chia sẻ kinh nghiệm nghề nghiệp và định hướng phát triển bền vững cho cộng đồng.",
    "Mỗi khoản quyên góp đều mang ý nghĩa thiết thực, tạo nên giá trị dài hạn cho thế hệ tiếp theo. Bằng tinh thần tương thân tương ái, chúng ta cùng nhau vun đắp một hệ sinh thái tri thức gắn kết, nơi mỗi cá nhân đều có thể tạo ra tác động tích cực.",
  ],
};

const PageBackground = styled(Box)`
  background: #f3f5f9;
  min-height: 100vh;
  padding: 40px 0 72px;
`;

const SurfaceCard = styled(Card)`
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 10px 26px rgba(15, 58, 122, 0.08);
`;

const CircleLogo = styled("img")`
  width: 116px;
  height: 116px;
  border-radius: 999px;
  object-fit: cover;
  box-shadow: 0 6px 18px rgba(17, 67, 142, 0.2);
`;

function DonationHeaderCard() {
  return (
    <SurfaceCard sx={{ px: { xs: 2.5, md: 4 }, py: { xs: 3.5, md: 4.5 }, mb: 3 }}>
      <Box sx={{ textAlign: "center" }}>
        <CircleLogo src={DONATION_DETAIL.logo} alt="HCMUS Alumni logo" />
        <Typography variant="h4" sx={{ mt: 2.2, fontWeight: 800, color: "#122f5a", fontSize: { xs: "1.6rem", md: "2rem" } }}>
          {DONATION_DETAIL.title}
        </Typography>
      </Box>
    </SurfaceCard>
  );
}

const DONATION_AMOUNTS = [
  { value: "100000", label: "100,000 VND" },
  { value: "200000", label: "200,000 VND" },
  { value: "500000", label: "500,000 VND" },
  { value: "1000000", label: "1,000,000 VND" },
  { value: "custom", label: "Nhập số tiền khác" },
];

const FUNDRAISING_LIST_MOCK_DATA = [
  {
    id: 1,
    name: "Nguyễn Minh Anh",
    message: "Hy vọng quỹ sẽ tiếp sức cho nhiều bạn sinh viên vượt khó và theo đuổi ước mơ.",
    timestamp: "21/01/2026 08:00",
    amount: "139,306 VNĐ",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: 2,
    name: "Trần Gia Huy",
    message: "Mong các em có thêm điều kiện học tập tốt hơn, đặc biệt là tài liệu và thiết bị thực hành.",
    timestamp: "21/01/2026 09:15",
    amount: "350,000 VNĐ",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: 3,
    name: "Lê Thảo Vy",
    message: "Chúc chương trình lan tỏa mạnh mẽ để nhiều cựu sinh viên cùng chung tay đóng góp.",
    timestamp: "21/01/2026 10:40",
    amount: "1,200,000 VNĐ",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: 4,
    name: "Phạm Quốc Bảo",
    message: "Gửi một phần nhỏ để hỗ trợ học bổng, mong các bạn luôn vững tin trên hành trình học tập.",
    timestamp: "21/01/2026 14:25",
    amount: "500,000 VNĐ",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: 5,
    name: "Đỗ Ngọc Trâm",
    message: "Mình tin sự sẻ chia hôm nay sẽ tạo nên giá trị bền vững cho cộng đồng sinh viên ngày mai.",
    timestamp: "22/01/2026 08:10",
    amount: "2,000,000 VNĐ",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: 6,
    name: "Vũ Thanh Tùng",
    message: "Chúc quỹ hoạt động hiệu quả và minh bạch để tiếp tục nhận được nhiều sự ủng hộ hơn nữa.",
    timestamp: "22/01/2026 09:30",
    amount: "750,000 VNĐ",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
  },
];

const DONOR_COUNT_DISPLAY_MAX = 999999;
const AVERAGE_DONATION_DISPLAY_MAX = 999999999;

const formatDonorCountDisplay = (value) =>
  value > DONOR_COUNT_DISPLAY_MAX ? `> ${DONOR_COUNT_DISPLAY_MAX.toLocaleString("vi-VN")}` : value.toLocaleString("vi-VN");

const formatAverageDonationDisplay = (value) =>
  value > AVERAGE_DONATION_DISPLAY_MAX
    ? `> ${AVERAGE_DONATION_DISPLAY_MAX.toLocaleString("vi-VN")} VND`
    : `${value.toLocaleString("vi-VN")} VND`;

const formatVndDisplay = (value) => `${Number(value ?? 0).toLocaleString("vi-VN")} VND`;

function DonationFundInfoPanel() {
  const progressValue = Math.min(
    100,
    Math.round(((DONATION_DETAIL.currentAmount ?? 0) / Math.max(DONATION_DETAIL.targetAmount ?? 1, 1)) * 100)
  );

  return (
    <Box
      sx={{
        p: { xs: 0, md: 1 },
        height: "100%",
        minHeight: { md: 560 },
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography sx={{ color: "#1a4ea3", fontWeight: 700, fontSize: "0.9rem", mb: 1 }}>Thông tin quỹ</Typography>
      <Typography sx={{ mt: 1.2, color: "#365886", fontSize: "0.94rem", fontWeight: 600 }}>
        Người quản lí: {DONATION_DETAIL.managerName}
      </Typography>
      <Box
        sx={{
          mt: 1,
          display: "inline-flex",
          px: 1.2,
          py: 0.45,
          borderRadius: 99,
          fontSize: "0.78rem",
          fontWeight: 700,
          color: "#0f4b72",
          backgroundColor: "#e0f2fe",
          border: "1px solid",
          borderColor: "#7dd3fc",
          width: "fit-content",
        }}
      >
        {DONATION_DETAIL.fundStatus}
      </Box>
      <Typography sx={{ mt: 1.2, color: "#5f78a4", fontSize: "0.92rem" }}>
        Thời gian bắt đầu: {dayjs(DONATION_DETAIL.startDate).format("DD/MM/YYYY")}
      </Typography>
      <Typography sx={{ mt: 0.4, color: "#5f78a4", fontSize: "0.92rem" }}>
        Thời gian kết thúc: {dayjs(DONATION_DETAIL.endDate).format("DD/MM/YYYY")}
      </Typography>

      <Box sx={{ mt: 1.4 }}>
        <Box sx={{ mb: 0.7, display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 0.8 }}>
          <Typography sx={{ color: "#5f78a4", fontSize: "0.82rem", fontStyle: "italic" }}>
            Tiến độ gây quỹ hiện tại
          </Typography>
          <Typography sx={{ color: "#2f4b75", fontWeight: 700, fontSize: "0.84rem" }}>
            {formatVndDisplay(DONATION_DETAIL.currentAmount)} / {formatVndDisplay(DONATION_DETAIL.targetAmount)}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progressValue}
          sx={{
            height: 28,
            borderRadius: 999,
            backgroundColor: "#e4e7ef",
            overflow: "hidden",
            "& .MuiLinearProgress-bar": {
              borderRadius: 999,
              backgroundColor: "#123b7a",
            },
          }}
        />
      </Box>

      <Grid container spacing={2} sx={{ mt: 1.8 }}>
        <Grid size={6}>
          <Typography
            sx={{
              fontWeight: 800,
              color: "#102f59",
              fontSize: "1.5rem",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {formatDonorCountDisplay(DONATION_DETAIL.donorCount)}
          </Typography>
          <Typography sx={{ color: "#5f78a4", fontSize: "0.9rem" }}>lượt quyên góp</Typography>
        </Grid>
        <Grid size={6}>
          <Typography
            sx={{
              fontWeight: 800,
              color: "#102f59",
              fontSize: "1.2rem",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {formatAverageDonationDisplay(DONATION_DETAIL.averageDonation)}
          </Typography>
          <Typography sx={{ color: "#5f78a4", fontSize: "0.9rem" }}>trung bình</Typography>
        </Grid>
      </Grid>

      <Box
        sx={{
          mt: 1.8,
          maxHeight: { xs: 180, md: 220 },
          overflowY: "auto",
          pr: 0.5,
        }}
      >
        <Typography sx={{ color: "#4b6083", fontSize: "0.95rem", lineHeight: 1.7 }}>{DONATION_DETAIL.description}</Typography>
      </Box>
    </Box>
  );
}

function DonationContributionForm() {
  const {
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      amountOption: "",
      customAmount: "",
      donorName: "",
      email: "",
      phone: "",
      address: "",
      message: "",
    },
  });

  const selectedAmountOption = watch("amountOption");

  const onSubmit = (data) => {
    console.log("Donation form submit:", data);
  };

  return (
    <Card
      sx={{
        borderRadius: 2.5,
        backgroundColor: "#ffffff",
        px: { xs: 2.5, md: 3.2 },
        py: { xs: 2.5, md: 3.2 },
        boxShadow: "0 12px 28px rgba(20, 79, 166, 0.12)",
        mb: 3,
      }}
    >
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <DonationFundInfoPanel />
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <Controller
                name="amountOption"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Số tiền"
                    SelectProps={{
                      MenuProps: {
                        disableScrollLock: true,
                      },
                    }}
                    error={Boolean(errors.amountOption)}
                    helperText={errors.amountOption?.message}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, backgroundColor: "#f7f9fc" } }}
                  >
                    {DONATION_AMOUNTS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            {selectedAmountOption === "custom" && (
              <Grid size={12}>
                <Controller
                  name="customAmount"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Nhập số tiền bất kỳ"
                      placeholder="VD: 350000"
                      error={Boolean(errors.customAmount)}
                      helperText={errors.customAmount?.message}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, backgroundColor: "#f7f9fc" } }}
                    />
                  )}
                />
              </Grid>
            )}

            <Grid size={12}>
              <Controller
                name="donorName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Họ và tên/tổ chức đóng góp"
                    error={Boolean(errors.donorName)}
                    helperText={errors.donorName?.message}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, backgroundColor: "#f7f9fc" } }}
                  />
                )}
              />
            </Grid>

            <Grid size={12}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email"
                    error={Boolean(errors.email)}
                    helperText={errors.email?.message}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, backgroundColor: "#f7f9fc" } }}
                  />
                )}
              />
            </Grid>

            <Grid size={12}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Số điện thoại"
                    placeholder="VD: 0976312345"
                    error={Boolean(errors.phone)}
                    helperText={errors.phone?.message}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, backgroundColor: "#f7f9fc" } }}
                  />
                )}
              />
            </Grid>

            <Grid size={12}>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Địa chỉ"
                    placeholder="VD: 59C Nguyễn Đình Chiểu..."
                    error={Boolean(errors.address)}
                    helperText={errors.address?.message}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, backgroundColor: "#f7f9fc" } }}
                  />
                )}
              />
            </Grid>

            <Grid size={12}>
              <Controller
                name="message"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Lời nhắn nhủ"
                    placeholder="Nhập lời nhắn của bạn..."
                    multiline
                    minRows={3}
                    onChange={(event) => {
                      const nextValue = event.target.value.slice(0, 100);
                      field.onChange(nextValue);
                    }}
                    error={Boolean(errors.message)}
                    helperText={errors.message?.message || `${field.value?.length || 0}/100`}
                    inputProps={{ maxLength: 100 }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, backgroundColor: "#f7f9fc" } }}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 2.2,
              height: 46,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              backgroundColor: "#0f7d8a",
              boxShadow: "0 6px 14px rgba(15, 125, 138, 0.25)",
              "&:hover": {
                backgroundColor: "#0d6671",
                boxShadow: "0 8px 16px rgba(15, 125, 138, 0.3)",
              },
            }}
          >
            Thực hiện đóng góp
          </Button>

          <Box sx={{ mt: 2.6 }}>
            <Typography sx={{ color: "#df5e2d", fontWeight: 800, mb: 1 }}>Lưu ý:</Typography>
            <Typography component="div" sx={{ color: "#4f617e", fontSize: "0.92rem", lineHeight: 1.7 }}>
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                <Box component="li">Vui lòng hoàn tất thanh toán dùng QR Code.</Box>
                <Box component="li">Nếu cần hỗ trợ, bạn có thể chọn hình thức chuyển khoản hoặc đóng góp trực tiếp.</Box>
              </Box>
            </Typography>
            <Typography sx={{ mt: 1.5, color: "#3f5477", fontSize: "0.92rem", lineHeight: 1.7 }}>
              Hotline: +84 906 060 606
              <br />
              Email: giaovu@hcmus.edu.vn
            </Typography>
          </Box>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
}

function DonationContent() {
  return (
    <SurfaceCard sx={{ px: { xs: 2.5, md: 4.5 }, py: { xs: 3.5, md: 5 } }}>
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <CircleLogo src={DONATION_DETAIL.logo} alt="HCMUS Alumni logo" />
        <Typography
          sx={{
            mt: 2.4,
            fontWeight: 800,
            color: "#102f5a",
            fontSize: { xs: "1.25rem", md: "1.65rem" },
            letterSpacing: { xs: 1.2, md: 2 },
            textTransform: "uppercase",
            lineHeight: 1.45,
          }}
        >
          CỘNG ĐỒNG CỰU SINH VIÊN KHOA HỌC
        </Typography>
      </Box>

      {DONATION_DETAIL.content.map((paragraph) => (
        <Typography
          key={paragraph.slice(0, 20)}
          sx={{
            color: "#4a5f82",
            fontSize: "1rem",
            lineHeight: 1.8,
            mb: 2.2,
            textAlign: { xs: "left", md: "justify" },
          }}
        >
          {paragraph}
        </Typography>
      ))}
    </SurfaceCard>
  );
}

function FundraisingList() {
  const [search, setSearch] = useState("");
  const [searchBy, setSearchBy] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 4;

  const filteredData = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return FUNDRAISING_LIST_MOCK_DATA;

    return FUNDRAISING_LIST_MOCK_DATA.filter((item) => {
      if (searchBy === "name") return item.name.toLowerCase().includes(normalizedSearch);
      if (searchBy === "message") return item.message.toLowerCase().includes(normalizedSearch);
      return item.name.toLowerCase().includes(normalizedSearch) || item.message.toLowerCase().includes(normalizedSearch);
    });
  }, [search, searchBy]);

  const pageCount = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, page]);

  return (
    <SurfaceCard sx={{ px: { xs: 2.5, md: 4 }, py: { xs: 3, md: 3.6 }, mb: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 2.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f2f5f", fontSize: { xs: "1.35rem", md: "1.6rem" } }}>
          Danh sách
        </Typography>
        <Button
          variant="contained"
          sx={{
            textTransform: "none",
            fontWeight: 700,
            px: 2.2,
            borderRadius: 2,
            backgroundColor: "#0f2f5f",
            "&:hover": {
              backgroundColor: "#0b2448",
            },
          }}
        >
          Xuất CSV
        </Button>
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ mb: 2.5 }}>
        <TextField
          select
          value={searchBy}
          onChange={(event) => {
            setSearchBy(event.target.value);
            setPage(1);
          }}
          sx={{
            minWidth: { xs: "100%", md: 200 },
            "& .MuiOutlinedInput-root": {
              borderRadius: 999,
              backgroundColor: "#ffffff",
            },
          }}
        >
          <MenuItem value="all">Tên + thông điệp</MenuItem>
          <MenuItem value="name">Tên</MenuItem>
          <MenuItem value="message">Thông điệp</MenuItem>
        </TextField>
        <TextField
          fullWidth
          placeholder="Tìm kiếm"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 999,
              backgroundColor: "#ffffff",
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#6b7f9f" }} />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Stack spacing={1.5} sx={{ minHeight: { xs: 430, md: 470 } }}>
          {paginatedData.map((item) => (
            <Box
              key={item.id}
              sx={{
                border: "1px solid #e4e9f4",
                borderRadius: 2.5,
                backgroundColor: "#ffffff",
                px: { xs: 1.4, sm: 2 },
                py: 1.4,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.2,
                transition: "box-shadow 0.2s ease, transform 0.2s ease",
                "&:hover": {
                  boxShadow: "0 10px 22px rgba(15, 58, 122, 0.12)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              <Stack direction="row" spacing={1.4} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  badgeContent={
                    <Box
                      sx={{
                        width: 11,
                        height: 11,
                        borderRadius: "50%",
                        backgroundColor: "#22c55e",
                        border: "2px solid #ffffff",
                      }}
                    />
                  }
                >
                  <Avatar src={item.avatar} alt={item.name} sx={{ width: 52, height: 52 }} />
                </Badge>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: "#0f2f5f", fontWeight: 800, fontSize: "1rem", lineHeight: 1.3 }} noWrap>
                    {item.name}
                  </Typography>
                  <Typography
                    sx={{
                      color: "#7184a3",
                      fontSize: "0.88rem",
                      mt: 0.3,
                      lineHeight: 1.35,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.message}
                  </Typography>
                  <Typography sx={{ color: "#8c9ab2", fontSize: "0.78rem", mt: 0.45 }}>{item.timestamp}</Typography>
                </Box>
              </Stack>

              <Typography
                sx={{
                  color: "#1155cc",
                  fontWeight: 800,
                  fontSize: { xs: "1rem", sm: "1.15rem" },
                  whiteSpace: "nowrap",
                  ml: 1,
                }}
              >
                {item.amount}
              </Typography>
            </Box>
          ))}
        </Stack>
      </motion.div>
      <Stack direction="row" justifyContent="center" sx={{ mt: 2.3 }}>
        <Pagination
          count={pageCount}
          page={Math.min(page, pageCount)}
          onChange={(_, value) => setPage(value)}
          color="primary"
          shape="rounded"
          size="medium"
          sx={{ "& .MuiPaginationItem-root": { fontWeight: 700 } }}
        />
      </Stack>
    </SurfaceCard>
  );
}

export default function DetailDonationPage() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "ADMIN";

  return (
    <Page
      title={DONATION_DETAIL.title}
      meta={<meta name="description" content="Chi tiết quỹ quyên góp cộng đồng cựu sinh viên khoa học." />}
    >
      <PageBackground>
        <Container maxWidth={false} sx={{ maxWidth: 1140 }}>
          <DonationHeaderCard />
          {isAdmin ? (
            <>
              <SurfaceCard sx={{ px: { xs: 2.5, md: 3.2 }, py: { xs: 2.5, md: 3.2 }, mb: 3 }}>
                <DonationFundInfoPanel />
              </SurfaceCard>
              <FundraisingList />
            </>
          ) : (
            <DonationContributionForm />
          )}
          <DonationContent />
        </Container>
      </PageBackground>
    </Page>
  );
}
