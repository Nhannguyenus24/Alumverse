import { useEffect, useState } from "react";
import { Box, Button, Card, Container, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TextField, Typography, LinearProgress } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import styled from "@emotion/styled";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useParams } from "react-router";
import Page from "../../components/Page";
import { fundApi } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";

import DonationListSection from "../../components/donation/DonationListSection";
import Breadcrumb from "../../components/Breadcrumb";

const donationSchema = z.object({
  amountOption: z.string().min(1, "Vui lòng chọn số tiền"),
  customAmount: z.coerce.number().optional(),
  donorName: z.string().min(1, "Vui lòng nhập họ và tên/tổ chức").max(50, "Tên tối đa 50 ký tự"),
  email: z.string().trim().max(255, "Email tối đa 255 ký tự").optional().or(z.literal("")),
  phone: z.string().trim().max(50, "Số điện thoại tối đa 50 ký tự").optional().or(z.literal("")),
  address: z.string().trim().max(500, "Địa chỉ tối đa 500 ký tự").optional().or(z.literal("")),
  message: z.string().trim().max(100, "Lời nhắn nhủ tối đa 100 ký tự").optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  if (data.amountOption === "custom") {
    if (!data.customAmount || Number.isNaN(data.customAmount) || data.customAmount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customAmount"],
        message: "Vui lòng nhập số tiền hợp lệ lớn hơn 0",
      });
    }
  }

  if (data.email && !z.string().email().safeParse(data.email).success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["email"],
      message: "Email không đúng định dạng",
    });
  }
});

const LOGO_FALLBACK_URL = "https://placehold.co/220x220/eef3ff/0f3a7a?text=HCMUS";

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

function DonationHeaderCard({ fundDetail }) {
  return (
    <SurfaceCard sx={{ px: { xs: 2.5, md: 4 }, py: { xs: 3.5, md: 4.5 }, mb: 3 }}>
      <Box sx={{ textAlign: "center" }}>
        <CircleLogo src={fundDetail?.logoUrl || LOGO_FALLBACK_URL} alt="HCMUS Alumni logo" />
        <Typography variant="h4" sx={{ mt: 2.2, fontWeight: 800, color: "#122f5a", fontSize: { xs: "1.6rem", md: "2rem" } }}>
          {fundDetail?.name || "Chi tiết quỹ"}
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

const DONOR_COUNT_DISPLAY_MAX = 999999;
const AVERAGE_DONATION_DISPLAY_MAX = 999999999;

const formatDonorCountDisplay = (value) =>
  value > DONOR_COUNT_DISPLAY_MAX ? `> ${DONOR_COUNT_DISPLAY_MAX.toLocaleString("vi-VN")}` : value.toLocaleString("vi-VN");

const formatAverageDonationDisplay = (value) =>
  value > AVERAGE_DONATION_DISPLAY_MAX
    ? `> ${AVERAGE_DONATION_DISPLAY_MAX.toLocaleString("vi-VN")} VND`
    : `${value.toLocaleString("vi-VN")} VND`;

const formatVndDisplay = (value) => `${Number(value ?? 0).toLocaleString("vi-VN")} VND`;

function DonationFundInfoPanel({ fundDetail }) {
  const donorCountValue = Number(fundDetail?.donorCount ?? 0);
  const averageDonationValue = donorCountValue > 0 ? Number(fundDetail?.currentAmount ?? 0) / donorCountValue : 0;
  const progressValue = Math.min(100, Math.round(((fundDetail?.currentAmount ?? 0) / Math.max(fundDetail?.targetAmount ?? 1, 1)) * 100));

  return (
    <Box sx={{ p: { xs: 0, md: 1 }, height: "100%", minHeight: { md: 560 }, display: "flex", flexDirection: "column" }}>
      <Typography sx={{ color: "#113f86", fontWeight: 800, fontSize: { xs: "1.2rem", md: "1.3rem" }, mb: 1.2 }}>
        Thông tin quỹ
      </Typography>
      <Typography sx={{ mt: 1.2, color: "#365886", fontSize: "0.94rem", fontWeight: 600 }}>
        Người quản lí: {fundDetail?.managerName || "--"}
      </Typography>
      <Box sx={{ mt: 1, display: "inline-flex", px: 1.2, py: 0.45, borderRadius: 99, fontSize: "0.78rem", fontWeight: 700, color: "#0f4b72", backgroundColor: "#e0f2fe", border: "1px solid", borderColor: "#7dd3fc", width: "fit-content" }}>
        {fundDetail?.statusName || "--"}
      </Box>
      <Typography sx={{ mt: 1.2, color: "#5f78a4", fontSize: "0.92rem" }}>
        Thời gian bắt đầu: {fundDetail?.timeStarted ? dayjs(fundDetail.timeStarted).format("DD/MM/YYYY") : "--"}
      </Typography>
      <Typography sx={{ mt: 0.4, color: "#5f78a4", fontSize: "0.92rem" }}>
        Thời gian kết thúc: {fundDetail?.timeEnded ? dayjs(fundDetail.timeEnded).format("DD/MM/YYYY") : "--"}
      </Typography>

      <Box sx={{ mt: 1.4 }}>
        <Box sx={{ mb: 0.7, display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 0.8 }}>
          <Typography sx={{ color: "#5f78a4", fontSize: "0.82rem", fontStyle: "italic" }}>
            Tiến độ gây quỹ hiện tại
          </Typography>
          <Typography sx={{ color: "#2f4b75", fontWeight: 700, fontSize: "0.84rem" }}>
            {formatVndDisplay(fundDetail?.currentAmount)} / {formatVndDisplay(fundDetail?.targetAmount)}
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={progressValue} sx={{ height: 28, borderRadius: 999, backgroundColor: "#e4e7ef", overflow: "hidden", "& .MuiLinearProgress-bar": { borderRadius: 999, backgroundColor: "#123b7a" } }} />
      </Box>

      <Grid container spacing={2} sx={{ mt: 1.8 }}>
        <Grid size={6}>
          <Typography sx={{ fontWeight: 800, color: "#102f59", fontSize: "1.5rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {formatDonorCountDisplay(donorCountValue)}
          </Typography>
          <Typography sx={{ color: "#5f78a4", fontSize: "0.9rem" }}>lượt quyên góp</Typography>
        </Grid>
        <Grid size={6}>
          <Typography sx={{ fontWeight: 800, color: "#102f59", fontSize: "1.2rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {formatAverageDonationDisplay(averageDonationValue)}
          </Typography>
          <Typography sx={{ color: "#5f78a4", fontSize: "0.9rem" }}>trung bình</Typography>
        </Grid>
      </Grid>

      <Box sx={{ mt: 1.8, px: 1.2, py: 1.1, borderRadius: 2, backgroundColor: "#f4f7fc", border: "1px solid #dfe8f6", maxHeight: { xs: 180, md: 220 }, overflowY: "auto", pr: 0.5 }}>
        <Typography sx={{ color: "#2f4b75", fontWeight: 700, fontSize: "0.86rem", mb: 0.55 }}>Mô tả quỹ</Typography>
        <Typography sx={{ color: "#4b6083", fontSize: "0.95rem", lineHeight: 1.7 }}>{fundDetail?.descriptionFull || "--"}</Typography>
      </Box>
    </Box>
  );
}

function DonationContributionForm({ fundDetail }) {
  const { user, isAuthenticated } = useAuth();
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [isCheckoutPopupOpen, setIsCheckoutPopupOpen] = useState(false);
  const [isQrFailed, setIsQrFailed] = useState(false);
  
  const { control, watch, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      amountOption: "", customAmount: "", donorName: "", email: "", phone: "", address: "", message: "",
    },
  });

  const selectedAmountOption = watch("amountOption");

  const onSubmit = async (data) => {
    setSubmitError("");
    setIsSubmitting(true);
    try {
      const selectedAmount = data.amountOption === "custom" ? data.customAmount : Number(data.amountOption);
      const payload = {
        fundId: Number(fundDetail?.id),
        donor_member_id: isAuthenticated ? user?.id ?? null : null,
        donor_name: data.donorName.trim(),
        amount: selectedAmount,
        address: data.address?.trim() || null,
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        message: data.message?.trim() || null,
      };

      const checkoutData = await fundApi.createFundDonation(payload);
      const nextCheckoutUrl = checkoutData?.checkoutUrl;
      if (!nextCheckoutUrl) {
        throw new Error("Không nhận được liên kết thanh toán.");
      }

      setCheckoutUrl(nextCheckoutUrl);
      setIsQrFailed(false);
      setIsCheckoutPopupOpen(true);
      reset();
    } catch (error) {
      setSubmitError(error?.response?.data?.message ?? error?.message ?? "Không thể tạo lượt đóng góp.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card sx={{ borderRadius: 2.5, backgroundColor: "#ffffff", px: { xs: 2.5, md: 3.2 }, py: { xs: 2.5, md: 3.2 }, boxShadow: "0 12px 28px rgba(20, 79, 166, 0.12)", mb: 3 }}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <DonationFundInfoPanel fundDetail={fundDetail} />
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
                      {...field} select fullWidth label="Số tiền"
                      SelectProps={{ MenuProps: { disableScrollLock: true } }}
                      error={Boolean(errors.amountOption)} helperText={errors.amountOption?.message}
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
                        {...field} fullWidth type="number" label="Nhập số tiền bất kỳ" placeholder="VD: 350000"
                        error={Boolean(errors.customAmount)} helperText={errors.customAmount?.message}
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
                      {...field} fullWidth label="Họ và tên/tổ chức đóng góp"
                      error={Boolean(errors.donorName)} helperText={errors.donorName?.message}
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
                      {...field} fullWidth label="Email" placeholder="Nhập email (không bắt buộc)"
                      error={Boolean(errors.email)} helperText={errors.email?.message}
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
                      {...field} fullWidth label="Số điện thoại" placeholder="VD: 0976312345 (không bắt buộc)"
                      error={Boolean(errors.phone)} helperText={errors.phone?.message}
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
                      {...field} fullWidth label="Địa chỉ" placeholder="VD: 59C Nguyễn Đình Chiểu... (không bắt buộc)"
                      error={Boolean(errors.address)} helperText={errors.address?.message}
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
                      {...field} fullWidth label="Lời nhắn nhủ" placeholder="Nhập lời nhắn của bạn (không bắt buộc)..." multiline minRows={3}
                      onChange={(event) => field.onChange(event.target.value.slice(0, 100))}
                      error={Boolean(errors.message)} helperText={errors.message?.message || `${field.value?.length || 0}/100 (không bắt buộc)`}
                      inputProps={{ maxLength: 100 }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, backgroundColor: "#f7f9fc" } }}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Button
              type="submit" fullWidth variant="contained" disabled={isSubmitting}
              sx={{ mt: 2.2, height: 46, borderRadius: 2, textTransform: "none", fontWeight: 700, backgroundColor: "#0f2f5f", boxShadow: "0 6px 14px rgba(15, 47, 95, 0.25)", "&:hover": { backgroundColor: "#0b2448", boxShadow: "0 8px 16px rgba(15, 47, 95, 0.3)" } }}
            >
              {isSubmitting ? "Đang xử lý..." : "Thực hiện đóng góp"}
            </Button>
            {submitError ? (
              <Typography sx={{ mt: 1, color: "#9f2f2f", fontWeight: 600, fontSize: "0.9rem" }}>{submitError}</Typography>
            ) : null}

            <Box sx={{ mt: 2.6 }}>
              <Typography sx={{ color: "#df5e2d", fontWeight: 800, mb: 1 }}>Lưu ý:</Typography>
              <Typography component="div" sx={{ color: "#4f617e", fontSize: "0.92rem", lineHeight: 1.7 }}>
                <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                  <Box component="li">Vui lòng hoàn tất thanh toán dùng QR Code.</Box>
                  <Box component="li">Nếu cần hỗ trợ, bạn có thể chọn hình thức chuyển khoản hoặc đóng góp trực tiếp.</Box>
                </Box>
              </Typography>
              <Typography sx={{ mt: 1.5, color: "#3f5477", fontSize: "0.92rem", lineHeight: 1.7 }}>
                Hotline: +84 906 060 606 <br /> Email: giaovu@hcmus.edu.vn
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
      <Dialog open={isCheckoutPopupOpen} onClose={() => setIsCheckoutPopupOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ color: "#123b7a", fontWeight: 800 }}>Hoàn tất thanh toán</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#4f617e", fontSize: "0.92rem", mb: 1.5 }}>
            Vui lòng quét mã QR bên dưới để hoàn tất đóng góp.
          </Typography>
          {!isQrFailed ? (
            <Box component="img" src={checkoutUrl} alt="Mã QR thanh toán" onError={() => setIsQrFailed(true)} sx={{ width: "100%", maxWidth: 280, mx: "auto", display: "block", borderRadius: 2, border: "1px solid #dce7f8" }} />
          ) : (
            <Typography sx={{ color: "#9f2f2f", fontWeight: 600, fontSize: "0.9rem" }}>
              Không thể hiển thị QR trực tiếp. Bạn vui lòng mở liên kết thanh toán.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "center" }}>
          <Button variant="contained" onClick={() => setIsCheckoutPopupOpen(false)} sx={{ textTransform: "none", fontWeight: 700, backgroundColor: "#0f2f5f", "&:hover": { backgroundColor: "#0b2448" } }}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

export default function DetailDonationPage() {

  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "ADMIN";
  const [fundDetail, setFundDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;
    const fetchFundDetail = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const detail = await fundApi.getFundDetail(id);
        if (ignore) return;
        setFundDetail(detail);
      } catch (error) {
        if (ignore) return;
        setFundDetail(null);
        setErrorMessage(error?.response?.data?.message ?? "Không thể tải chi tiết quỹ.");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    fetchFundDetail();
    return () => { ignore = true; };
  }, [id]);

  return (
    <Page title={fundDetail?.name || "Chi tiết quỹ"} meta={<meta name="description" content="Chi tiết quỹ quyên góp cộng đồng cựu sinh viên khoa học." />}>
      <PageBackground>
        <Container maxWidth={false} sx={{ maxWidth: 1140 }}>
          <Box sx={{ mb: 3 }}>
            <Breadcrumb items={[{ label: "QUYÊN GÓP", path: "/donations" }, { label: fundDetail?.name || "Chi tiết quỹ", path: `/donations/${id}` }, { label: "Quyên góp" }]} fontSize="0.8rem" />
          </Box>

          {isLoading ? (
            <SurfaceCard sx={{ px: { xs: 2.5, md: 4 }, py: 6, mb: 3 }}>
              <LinearProgress sx={{ height: 8, borderRadius: 999 }} />
            </SurfaceCard>
          ) : null}

          {!isLoading && errorMessage ? (
            <SurfaceCard sx={{ px: { xs: 2.5, md: 4 }, py: 4, mb: 3 }}>
              <Typography sx={{ color: "#9f2f2f", fontWeight: 700 }}>{errorMessage}</Typography>
            </SurfaceCard>
          ) : null}

          {!isLoading && !errorMessage && fundDetail ? (
            <>
              <DonationHeaderCard fundDetail={fundDetail} />
              {isAdmin ? (
                <>
                  <SurfaceCard sx={{ px: { xs: 2.5, md: 3.2 }, py: { xs: 2.5, md: 3.2 }, mb: 3 }}>
                    <DonationFundInfoPanel fundDetail={fundDetail} />
                  </SurfaceCard>
                  <DonationListSection fundId={id} />
                </>
              ) : (
                <DonationContributionForm fundDetail={fundDetail} />
              )}
            </>
          ) : null}
        </Container>
      </PageBackground>
    </Page>
  );
}