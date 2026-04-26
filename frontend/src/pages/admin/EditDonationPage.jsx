import { useMemo } from "react";
import { z } from "zod";
import dayjs from "dayjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useSnackbar } from "notistack";
import {
  Box,
  Button,
  Card,
  Container,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useParams } from "react-router";
import Page from "../../components/Page";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";

const STATUS_OPTIONS = [
  { value: "important", label: "Quan trọng" },
  { value: "remote_area", label: "Vùng sâu vùng xa" },
];

const FUND_RECEIVING_OPTIONS = [
  {
    value: "fri_001",
    bankName: "Ngân hàng TMCP Công thương Việt Nam",
    accountNumber: "1029384756"
  },
  {
    value: "fri_002",
    bankName: "Ngân hàng TMCP Quân đội",
    accountNumber: "7788991122"
  },
  {
    value: "fri_003",
    bankName: "Ngân hàng TMCP Á Châu",
    accountNumber: "2233445566"
  },
];

const formatCurrency = (value) => `${Number(value ?? 0).toLocaleString("vi-VN")} VND`;

const getFundPhase = (startDate, endDate, now) => {
  if (now.isBefore(startDate) && startDate.isBefore(endDate)) return "before_start";
  if (startDate.isBefore(now) && now.isBefore(endDate)) return "active";
  if (startDate.isBefore(endDate) && endDate.isBefore(now)) return "ended";
  return "invalid";
};

const buildEditSchema = ({ now, minAllowedTime, phase, originalStartDate, originalEndDate, originalTargetAmount }) =>
  z
    .object({
      name: z.string().trim().min(1, "Vui lòng nhập tên quỹ"),
      managerName: z.string().trim().min(1, "Vui lòng nhập tên người quản lí"),
      logoUrl: z.string().trim().url("Logo URL không hợp lệ"),
      descriptionShort: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập mô tả ngắn")
        .max(100, "Mô tả ngắn tối đa 100 kí tự"),
      descriptionFull: z.string().trim().min(1, "Vui lòng nhập mô tả đầy đủ"),
      targetAmount: z.coerce.number({ message: "Mục tiêu quỹ phải là số" }).positive("Mục tiêu quỹ phải lớn hơn 0"),
      fundReceivingInfoId: z.string().min(1, "Vui lòng chọn tài khoản nhận quỹ"),
      statusId: z.enum(["important", "remote_area"], {
        errorMap: () => ({ message: "Vui lòng chọn trạng thái" }),
      }),
      startDate: z
        .custom((value) => value === null || dayjs.isDayjs(value), {
          message: "Vui lòng chọn thời gian bắt đầu",
        })
        .refine((value) => value !== null, "Vui lòng chọn thời gian bắt đầu"),
      endDate: z
        .custom((value) => value === null || dayjs.isDayjs(value), {
          message: "Vui lòng chọn thời gian kết thúc",
        })
        .refine((value) => value !== null, "Vui lòng chọn thời gian kết thúc"),
    })
    .superRefine((data, ctx) => {
      const start = data.startDate;
      const end = data.endDate;
      if (!dayjs.isDayjs(start) || !dayjs.isDayjs(end)) return;

      if (!end.isAfter(start, "minute")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endDate"],
          message: "Thời gian kết thúc phải sau thời gian bắt đầu",
        });
      }

      if (phase === "before_start") {
        if (start.isBefore(minAllowedTime)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["startDate"],
            message: "Thời gian bắt đầu phải từ thời điểm hiện tại + 10 phút",
          });
        }
      }

      if (phase === "active") {
        if (!start.isSame(originalStartDate)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["startDate"],
            message: "Quỹ đang diễn ra, không thể sửa thời gian bắt đầu",
          });
        }
        if (end.isBefore(minAllowedTime)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["endDate"],
            message: "Khi quỹ đang diễn ra, thời gian kết thúc mới phải từ hiện tại + 10 phút",
          });
        }
        if (data.targetAmount !== originalTargetAmount) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["targetAmount"],
            message: "Quỹ đang diễn ra, không thể sửa mục tiêu quỹ",
          });
        }
      }

      if (phase === "ended") {
        if (
          !start.isSame(originalStartDate)
          || !end.isSame(originalEndDate)
          || data.targetAmount !== originalTargetAmount
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["endDate"],
            message: "Quỹ đã kết thúc, không thể chỉnh sửa",
          });
        }
      }
    });

export default function EditDonationPage() {
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { id } = useParams();

  const now = useMemo(() => dayjs(), []);
  const minAllowedTime = useMemo(() => now.add(10, "minute"), [now]);

  const donationDetail = useMemo(
    () => ({
      id,
      name: "Quỹ Cộng đồng Cựu sinh viên Khoa học",
      managerName: "Nguyễn Thanh Hương",
      logoUrl: "https://placehold.co/220x220/eef3ff/0f3a7a?text=HCMUS",
      descriptionShort: "Quỹ hỗ trợ sinh viên khó khăn, học bổng và hoạt động cộng đồng thiết thực.",
      descriptionFull:
        "Quỹ được thành lập nhằm hỗ trợ sinh viên có hoàn cảnh khó khăn, tài trợ học bổng, và thúc đẩy các hoạt động học thuật có giá trị cho cộng đồng cựu sinh viên. Song song đó, quỹ còn đồng hành cùng các chương trình hướng nghiệp, mentoring và các dự án liên ngành nhằm tăng khả năng tiếp cận cơ hội học tập chất lượng cho người học.",
      targetAmount: 500000000,
      currentAmount: 258000000,
      donorCount: 57000,
      fundReceivingInfoId: "fri_001",
      statusId: "important",
      startDate: now.add(2, "day"),
      endDate: now.add(30, "day"),
    }),
    [id, now]
  );

  const phase = useMemo(
    () => getFundPhase(donationDetail.startDate, donationDetail.endDate, now),
    [donationDetail.endDate, donationDetail.startDate, now]
  );

  const editSchema = useMemo(
    () =>
      buildEditSchema({
        now,
        minAllowedTime,
        phase,
        originalStartDate: donationDetail.startDate,
        originalEndDate: donationDetail.endDate,
        originalTargetAmount: donationDetail.targetAmount,
      }),
    [donationDetail.endDate, donationDetail.startDate, donationDetail.targetAmount, minAllowedTime, now, phase]
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: donationDetail.name,
      managerName: donationDetail.managerName,
      logoUrl: donationDetail.logoUrl,
      descriptionShort: donationDetail.descriptionShort,
      descriptionFull: donationDetail.descriptionFull,
      targetAmount: donationDetail.targetAmount,
      fundReceivingInfoId: donationDetail.fundReceivingInfoId,
      statusId: donationDetail.statusId,
      startDate: donationDetail.startDate,
      endDate: donationDetail.endDate,
    },
  });

  const preview = watch();
  const selectedReceivingInfo = useMemo(
    () => FUND_RECEIVING_OPTIONS.find((option) => option.value === preview.fundReceivingInfoId),
    [preview.fundReceivingInfoId]
  );
  const progress = Math.min(
    100,
    Math.round(((donationDetail.currentAmount ?? 0) / Math.max(Number(preview.targetAmount ?? 1), 1)) * 100)
  );

  const disableAllFields = phase === "ended";
  const disableStartDate = disableAllFields || phase === "active";
  const disableEndDate = disableAllFields;
  const disableTargetAmount = disableAllFields || phase === "active";
  const disableFundReceivingInfo = phase !== "before_start";

  const noteMessage = {
    before_start:
      "Quỹ chưa bắt đầu: có thể sửa start date, end date, target amount và tài khoản ngân hàng nhận quỹ.",
    active:
      "Quỹ đang diễn ra: chỉ có thể sửa end date (>= hiện tại + 10 phút). Không thể sửa target amount, start date và tài khoản ngân hàng nhận quỹ.",
    ended: "Quỹ đã kết thúc: không thể chỉnh sửa.",
    invalid: "Khoảng thời gian quỹ chưa hợp lệ.",
  }[phase];

  const onSubmit = async (values) => {
    if (disableAllFields) {
      enqueueSnackbar("Quỹ đã kết thúc, không thể chỉnh sửa.", { variant: "warning" });
      return;
    }
    console.log("Edit donation payload:", {
      ...values,
      startDate: values.startDate?.format("YYYY-MM-DD HH:mm"),
      endDate: values.endDate?.format("YYYY-MM-DD HH:mm"),
    });
    enqueueSnackbar("Cập nhật quỹ thành công (mock).", { variant: "success" });
    navigate(`/donations/${id}`);
  };

  return (
    <Page title="Chỉnh sửa quỹ quyên góp" meta={<meta name="description" content="Chỉnh sửa quỹ quyên góp" />}>
      <Box sx={{ py: 5, backgroundColor: "#f3f5f9", minHeight: "100vh" }}>
        <Container maxWidth={false} sx={{ maxWidth: 1160 }}>
          <Typography variant="h4" sx={{ mb: 2.5, fontWeight: 800, color: "#123661" }}>
            Chỉnh sửa quỹ #{id}
          </Typography>
          <Box
            sx={{
              mb: 3,
              borderRadius: 2,
              border: "1px solid #9ec5ff",
              backgroundColor: "#eef5ff",
              px: 1.5,
              py: 1.2,
            }}
          >
            <Typography sx={{ color: "#0f4fb8", fontWeight: 900, fontSize: "0.95rem", letterSpacing: 0.3 }}>
              Note
            </Typography>
            <Typography sx={{ mt: 0.3, color: "#214c90", fontWeight: 600, lineHeight: 1.6 }}>{noteMessage}</Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Card sx={{ borderRadius: 3, p: 3, height: "100%", boxShadow: "0 10px 26px rgba(15, 58, 122, 0.08)" }}>
                <Box sx={{ textAlign: "center", mb: 2.2 }}>
                  <Box
                    component="img"
                    src={preview.logoUrl}
                    alt={preview.name}
                    sx={{
                      width: 122,
                      height: 122,
                      borderRadius: "50%",
                      objectFit: "cover",
                      boxShadow: "0 6px 18px rgba(17, 67, 142, 0.2)",
                    }}
                  />
                  <Typography sx={{ mt: 1.8, fontWeight: 800, color: "#102f5a", fontSize: "1.45rem" }}>{preview.name}</Typography>
                  <Typography sx={{ mt: 0.6, color: "#4f678d", fontSize: "0.92rem" }}>
                    Người quản lí: {preview.managerName}
                  </Typography>
                <Typography sx={{ mt: 0.6, color: "#4f678d", fontSize: "0.9rem", lineHeight: 1.55 }}>
                  Tài khoản nhận quỹ:
                  <br />
                  {selectedReceivingInfo
                    ? `${selectedReceivingInfo.bankName} - ${selectedReceivingInfo.accountNumber}`
                    : "Chưa chọn"}
                </Typography>
                </Box>

                <Box
                  sx={{
                    display: "inline-flex",
                    px: 1.2,
                    py: 0.45,
                    borderRadius: 99,
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "#0f4b72",
                    backgroundColor: "#e0f2fe",
                    border: "1px solid #7dd3fc",
                    width: "fit-content",
                  }}
                >
                  {STATUS_OPTIONS.find((option) => option.value === preview.statusId)?.label}
                </Box>

                <Typography sx={{ mt: 1.4, color: "#5f78a4", fontSize: "0.9rem" }}>
                  {dayjs(preview.startDate).format("DD/MM/YYYY HH:mm")} - {dayjs(preview.endDate).format("DD/MM/YYYY HH:mm")}
                </Typography>

                <Typography sx={{ mt: 1.1, color: "#2f4b75", fontWeight: 700, fontSize: "0.84rem" }}>
                  {formatCurrency(donationDetail.currentAmount)} / {formatCurrency(preview.targetAmount)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    mt: 0.8,
                    height: 28,
                    borderRadius: 999,
                    backgroundColor: "#e4e7ef",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 999,
                      backgroundColor: "#123b7a",
                    },
                  }}
                />

                <Typography sx={{ mt: 1.4, color: "#102f59", fontWeight: 800, fontSize: "1.3rem" }}>
                  {Number(donationDetail.donorCount).toLocaleString("vi-VN")}
                </Typography>
                <Typography sx={{ color: "#5f78a4", fontSize: "0.9rem" }}>lượt quyên góp</Typography>

                <Typography sx={{ mt: 1.8, color: "#2d4873", fontWeight: 700 }}>Mô tả đầy đủ</Typography>
                <Box
                  sx={{
                    mt: 0.8,
                    maxHeight: 260,
                    overflowY: "auto",
                    borderRadius: 2,
                    backgroundColor: "#f7f9fc",
                    border: "1px solid #e0e7f3",
                    p: 1.2,
                  }}
                >
                  <Typography sx={{ color: "#4b6083", fontSize: "0.95rem", lineHeight: 1.7 }}>{preview.descriptionFull}</Typography>
                </Box>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Card sx={{ borderRadius: 3, p: 3, boxShadow: "0 10px 26px rgba(15, 58, 122, 0.08)" }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={2}>
                      <Grid size={12}>
                        <TextField fullWidth label="Tên quỹ" {...register("name")} disabled={disableAllFields} error={!!errors.name} helperText={errors.name?.message} />
                      </Grid>
                      <Grid size={12}>
                        <TextField
                          fullWidth
                          label="Tên người quản lí"
                          {...register("managerName")}
                          disabled={disableAllFields}
                          error={!!errors.managerName}
                          helperText={errors.managerName?.message}
                        />
                      </Grid>
                      <Grid size={12}>
                        <TextField fullWidth label="Logo URL" {...register("logoUrl")} disabled={disableAllFields} error={!!errors.logoUrl} helperText={errors.logoUrl?.message} />
                      </Grid>
                      <Grid size={12}>
                        <TextField
                          fullWidth
                          multiline
                          minRows={2}
                          label="Mô tả ngắn"
                          {...register("descriptionShort")}
                          disabled={disableAllFields}
                          error={!!errors.descriptionShort}
                          helperText={errors.descriptionShort?.message}
                        />
                      </Grid>
                      <Grid size={12}>
                        <TextField
                          fullWidth
                          multiline
                          minRows={5}
                          label="Mô tả đầy đủ"
                          {...register("descriptionFull")}
                          disabled={disableAllFields}
                          error={!!errors.descriptionFull}
                          helperText={errors.descriptionFull?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Mục tiêu quỹ (VND)"
                          {...register("targetAmount")}
                          disabled={disableTargetAmount}
                          error={!!errors.targetAmount}
                          helperText={errors.targetAmount?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth error={!!errors.fundReceivingInfoId}>
                          <InputLabel id="fund-receiving-info-label">Tài khoản nhận quỹ</InputLabel>
                          <Controller
                            name="fundReceivingInfoId"
                            control={control}
                            render={({ field }) => (
                              <Select
                                {...field}
                                labelId="fund-receiving-info-label"
                                label="Tài khoản nhận quỹ"
                                disabled={disableFundReceivingInfo}
                                MenuProps={{ disableScrollLock: true }}
                              >
                                {FUND_RECEIVING_OPTIONS.map((option) => (
                                  <MenuItem key={option.value} value={option.value}>
                                    {`${option.bankName} - ${option.accountNumber}`}
                                  </MenuItem>
                                ))}
                              </Select>
                            )}
                          />
                          <FormHelperText>{errors.fundReceivingInfoId?.message}</FormHelperText>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth error={!!errors.statusId}>
                          <InputLabel id="status-id-label">Trạng thái</InputLabel>
                          <Controller
                            name="statusId"
                            control={control}
                            render={({ field }) => (
                              <Select
                                {...field}
                                labelId="status-id-label"
                                label="Trạng thái"
                                disabled={disableAllFields}
                                MenuProps={{ disableScrollLock: true }}
                              >
                                {STATUS_OPTIONS.map((option) => (
                                  <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            )}
                          />
                          <FormHelperText>{errors.statusId?.message}</FormHelperText>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                          name="startDate"
                          control={control}
                          render={({ field }) => (
                            <DatePicker
                              label="Thời gian bắt đầu"
                              value={field.value}
                              onChange={field.onChange}
                              disabled={disableStartDate}
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  error: !!errors.startDate,
                                  helperText: errors.startDate?.message,
                                },
                              }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                          name="endDate"
                          control={control}
                          render={({ field }) => (
                            <DatePicker
                              label="Thời gian kết thúc"
                              value={field.value}
                              onChange={field.onChange}
                              disabled={disableEndDate}
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  error: !!errors.endDate,
                                  helperText: errors.endDate?.message,
                                },
                              }}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>

                    <Stack direction="row" justifyContent="flex-end" spacing={1.2} sx={{ mt: 2.5 }}>
                      <Button variant="outlined" onClick={() => navigate(`/donations/${id}`)} sx={{ textTransform: "none", px: 2.6 }}>
                        Hủy
                      </Button>
                      <Button type="submit" variant="contained" disabled={isSubmitting || disableAllFields} sx={{ textTransform: "none", px: 2.6 }}>
                        Lưu thay đổi
                      </Button>
                    </Stack>
                  </Box>
                </LocalizationProvider>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Page>
  );
}
