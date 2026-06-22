import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import dayjs from "dayjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useSnackbar } from "notistack";
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  Grid,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { useParams } from "react-router";
import Page from "../../components/Page";
import WYSIWYG from "../../components/WYSIWYG";
import FundReceivingInfoSelect from "../../components/FundReceivingInfoSelect";
import { fundApi } from "../../utils/api";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";
import Breadcrumb from "../../components/Breadcrumb";
import MoneyField from "../../components/MoneyField";
import FundLogoPreview from "../../components/FundLogoPreview";
import { useUploadImage, validateImageFile, IMAGE_ACCEPT, FUND_CONTENT_EDITOR_HEIGHT } from "../../utils/imageUtils";

const isEmptyHtml = (html) => {
  if (!html || typeof html !== "string") return true;
  const stripped = html.replace(/<[^>]*>/g, "").trim();
  return stripped.length === 0;
};

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getFundPhase = (startDate, endDate, now) => {
  if (!dayjs.isDayjs(startDate) || !dayjs.isDayjs(endDate)) return "invalid";
  if (now.isBefore(startDate) && startDate.isBefore(endDate)) return "before_start";
  if (startDate.isBefore(now) && now.isBefore(endDate)) return "active";
  if (startDate.isBefore(endDate) && endDate.isBefore(now)) return "ended";
  return "invalid";
};

const buildEditSchema = ({ minAllowedTime, phase, originalStartDate, originalEndDate, originalTargetAmount }) =>
  z
    .object({
      name: z.string().trim().min(1, "Vui lòng nhập tên quỹ"),
      managerName: z.string().trim().min(1, "Vui lòng nhập tên người quản lí"),
      descriptionShort: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập mô tả ngắn")
        .max(100, "Mô tả ngắn tối đa 100 ký tự"),
      descriptionFull: z
        .string()
        .refine((value) => !isEmptyHtml(value), "Vui lòng nhập mô tả đầy đủ"),
      targetAmount: z.coerce.number({ message: "Mục tiêu quỹ phải là số" }).positive("Mục tiêu quỹ phải lớn hơn 0"),
      fundReceivingInfoId: z.coerce.number().int().positive("Vui lòng chọn tài khoản nhận quỹ"),
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

      if (phase === "before_start" && start.isBefore(minAllowedTime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["startDate"],
          message: "Thời gian bắt đầu phải từ thời điểm hiện tại + 10 phút",
        });
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

      if (
        phase === "ended"
        && (!start.isSame(originalStartDate) || !end.isSame(originalEndDate) || data.targetAmount !== originalTargetAmount)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endDate"],
          message: "Quỹ đã kết thúc, không thể chỉnh sửa",
        });
      }
    });

export default function EditDonationPage() {
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { id } = useParams();
  const { uploadFile: uploadLogo, isPending: isUploadingLogo } = useUploadImage();
  const [receivingOptions, setReceivingOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const logoInputRef = useRef(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const now = useMemo(() => dayjs(), []);
  const minAllowedTime = useMemo(() => now.add(10, "minute"), [now]);
  const [donationDetail, setDonationDetail] = useState(() => ({
    name: "",
    logoUrl: "",
    targetAmount: 0,
    startDate: now,
    endDate: now.add(1, "day"),
  }));

  const phase = useMemo(
    () => getFundPhase(donationDetail.startDate, donationDetail.endDate, now),
    [donationDetail.endDate, donationDetail.startDate, now]
  );

  const editSchema = useMemo(
    () =>
      buildEditSchema({
        minAllowedTime,
        phase,
        originalStartDate: donationDetail.startDate,
        originalEndDate: donationDetail.endDate,
        originalTargetAmount: donationDetail.targetAmount,
      }),
    [donationDetail.endDate, donationDetail.startDate, donationDetail.targetAmount, minAllowedTime, phase]
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: "",
      managerName: "",
      descriptionShort: "",
      descriptionFull: "",
      targetAmount: 0,
      fundReceivingInfoId: "",
      startDate: now,
      endDate: now.add(1, "day"),
    },
  });

  const pickImageFile = (file, onValid, inputEl) => {
    const result = validateImageFile(file);
    if (!result.valid) {
      enqueueSnackbar(result.message, { variant: "warning" });
      if (inputEl) inputEl.value = "";
      return;
    }
    onValid(file);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    pickImageFile(
      file,
      (f) => {
        setLogoFile(f);
        setLogoPreview(URL.createObjectURL(f));
      },
      e.target,
    );
  };

  useEffect(() => {
    let mounted = true;

    const loadEditData = async () => {
      try {
        setIsLoading(true);
        const [detail, receivingInfos] = await Promise.all([
          fundApi.getFundDetail(id),
          fundApi.getActiveFundReceivingInfos(),
        ]);

        if (!mounted) {
          return;
        }

        const resolvedReceivingInfos = receivingInfos ?? [];
        const startDate = detail?.timeStarted ? dayjs(detail.timeStarted) : null;
        const endDate = detail?.timeEnded ? dayjs(detail.timeEnded) : null;
        const normalizedDetail = {
          name: detail?.name ?? "",
          logoUrl: detail?.logoUrl ?? "",
          targetAmount: toSafeNumber(detail?.targetAmount, 0),
          startDate: startDate && startDate.isValid() ? startDate : now,
          endDate: endDate && endDate.isValid() ? endDate : now.add(1, "day"),
        };

        setReceivingOptions(resolvedReceivingInfos);
        setDonationDetail(normalizedDetail);
        setLogoFile(null);
        setLogoPreview(normalizedDetail.logoUrl || null);
        reset({
          name: normalizedDetail.name,
          managerName: detail?.managerName ?? "",
          descriptionShort: detail?.descriptionShort ?? "",
          descriptionFull: detail?.descriptionFull ?? "",
          targetAmount: normalizedDetail.targetAmount,
          fundReceivingInfoId: detail?.fundReceivingInfo?.id ?? "",
          startDate: normalizedDetail.startDate,
          endDate: normalizedDetail.endDate,
        });
      } catch (error) {
        if (!mounted) {
          return;
        }
        enqueueSnackbar(error?.response?.data?.message || "Không tải được chi tiết quỹ quyên góp", {
          variant: "error",
        });
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    if (id) {
      loadEditData();
    } else {
      setIsLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [enqueueSnackbar, id, now, reset]);

  const disableAllFields = phase === "ended";
  const disableStartDate = disableAllFields || phase === "active";
  const disableEndDate = disableAllFields;
  const disableTargetAmount = disableAllFields || phase === "active";
  const disableFundReceivingInfo = phase !== "before_start";

  const noteMessage = {
    before_start:
      "Quỹ chưa bắt đầu: có thể sửa field bất kỳ",
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

    try {
      const logoUrl = logoFile
        ? await uploadLogo(logoFile)
        : donationDetail.logoUrl?.trim() || null;

      const payload = {
        name: values.name?.trim(),
        managerName: values.managerName?.trim(),
        logoUrl,
        description_short: values.descriptionShort?.trim(),
        description_full: values.descriptionFull,
        targetAmount: Number(values.targetAmount),
        fundReceivingInfoId: Number(values.fundReceivingInfoId),
        timeStarted: values.startDate?.format("YYYY-MM-DDTHH:mm:ss"),
        timeEnded: values.endDate?.format("YYYY-MM-DDTHH:mm:ss"),
      };

      await fundApi.updateFund(id, payload);
      enqueueSnackbar("Cập nhật quỹ thành công.", { variant: "success" });
      navigate(`/donations/${id}`);
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || "Cập nhật quỹ thất bại", {
        variant: "error",
      });
    }
  };

  const isBusy = isSubmitting || isUploadingLogo;

  return (
    <Page title="Chỉnh sửa quỹ quyên góp" meta={<meta name="description" content="Chỉnh sửa quỹ quyên góp" />}>
      <Box sx={{ py: 5, backgroundColor: "#f3f5f9", minHeight: "100vh" }}>
        <Container maxWidth={false} sx={{ maxWidth: 1160 }}>
            <Breadcrumb
              items={[
                { label: "Quyên góp", path: "/donations" },
                { label: donationDetail.name || `Donation ${id}`, path: `/donations/${id}` },
                { label: "Chỉnh sửa quỹ" },
              ]}
              fontSize="0.9rem"
            />

          <Typography variant="h1" sx={{ mb: 2.5, fontWeight: 800, color: "#123661" }}>
            CHỈNH SỬA QUỸ
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

          {isLoading && <LinearProgress sx={{ mb: 2.2 }} />}

          <Box sx={{ maxWidth: 800, mx: "auto" }}>
            <Card sx={{ borderRadius: 3, p: 3, boxShadow: "0 10px 26px rgba(15, 58, 122, 0.08)" }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={2}>
                      <Grid size={12}>
                        <TextField fullWidth label="Tên quỹ" InputLabelProps={{ shrink: true }} {...register("name")} disabled={disableAllFields} error={!!errors.name} helperText={errors.name?.message} />
                      </Grid>
                      <Grid size={12}>
                        <TextField
                          fullWidth
                          label="Tên người quản lí"
                          InputLabelProps={{ shrink: true }}
                          {...register("managerName")}
                          disabled={disableAllFields}
                          error={!!errors.managerName}
                          helperText={errors.managerName?.message}
                        />
                      </Grid>
                      <Grid size={12}>
                        <Typography
                          variant="body2"
                          sx={{ mb: 1.2, fontWeight: 600, color: "text.secondary" }}
                        >
                          Logo quỹ (tuỳ chọn)
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                          Hỗ trợ JPG, JPEG, PNG — tối đa 2MB.
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 1.5, width: "100%" }}>
                          {logoPreview && <FundLogoPreview src={logoPreview} />}
                          <Stack direction="row" spacing={1} alignItems="center">
                            <input
                              ref={logoInputRef}
                              type="file"
                              accept={IMAGE_ACCEPT}
                              style={{ display: "none" }}
                              onChange={handleLogoChange}
                              disabled={disableAllFields}
                            />
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => logoInputRef.current?.click()}
                              disabled={disableAllFields}
                              sx={{ textTransform: "none" }}
                            >
                              {logoPreview ? "Đổi ảnh logo" : "Chọn ảnh logo"}
                            </Button>
                          </Stack>
                        </Box>
                      </Grid>
                      <Grid size={12}>
                        <TextField
                          fullWidth
                          multiline
                          minRows={2}
                          label="Mô tả ngắn (tối đa 100 ký tự)"
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ maxLength: 100 }}
                          {...register("descriptionShort")}
                          disabled={disableAllFields}
                          error={!!errors.descriptionShort}
                          helperText={errors.descriptionShort?.message}
                        />
                      </Grid>
                      <Grid size={12} sx={{ mb: 3 }}>
                        <Typography
                          variant="body2"
                          sx={{ mb: 1, fontWeight: 600, color: "text.secondary" }}
                        >
                          Mô tả đầy đủ
                        </Typography>
                        <Controller
                          name="descriptionFull"
                          control={control}
                          render={({ field }) => (
                            <WYSIWYG
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Nhập mô tả chi tiết về quỹ quyên góp..."
                              height={FUND_CONTENT_EDITOR_HEIGHT}
                              readOnly={disableAllFields}
                            />
                          )}
                        />
                        {errors.descriptionFull && (
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ mt: 0.5, display: "block" }}
                          >
                            {errors.descriptionFull.message}
                          </Typography>
                        )}
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                          name="targetAmount"
                          control={control}
                          render={({ field }) => (
                            <MoneyField
                              fullWidth
                              label="Mục tiêu quỹ (VND)"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              disabled={disableTargetAmount}
                              error={!!errors.targetAmount}
                              helperText={errors.targetAmount?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                          name="fundReceivingInfoId"
                          control={control}
                          render={({ field }) => (
                            <FundReceivingInfoSelect
                              value={field.value}
                              onChange={field.onChange}
                              options={receivingOptions}
                              disabled={disableFundReceivingInfo}
                              error={!!errors.fundReceivingInfoId}
                              helperText={errors.fundReceivingInfoId?.message}
                              labelId="fund-receiving-info-label"
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                          name="startDate"
                          control={control}
                          render={({ field }) => (
                            <DateTimePicker
                              label="Thời gian bắt đầu"
                              value={field.value}
                              onChange={field.onChange}
                              views={["year", "month", "day", "hours", "minutes", "seconds"]}
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
                            <DateTimePicker
                              label="Thời gian kết thúc"
                              value={field.value}
                              onChange={field.onChange}
                              views={["year", "month", "day", "hours", "minutes", "seconds"]}
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
                      <Button variant="outlined" onClick={() => navigate(-1)} sx={{ textTransform: "none", px: 2.6 }}>
                        Hủy
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={isBusy || disableAllFields}
                        startIcon={isUploadingLogo ? <CircularProgress size={16} color="inherit" /> : null}
                        sx={{ textTransform: "none", px: 2.6 }}
                      >
                        {isUploadingLogo ? "Đang tải ảnh..." : isBusy ? "Đang lưu..." : "Lưu thay đổi"}
                      </Button>
                    </Stack>
                  </Box>
                </LocalizationProvider>
            </Card>
          </Box>
        </Container>
      </Box>
    </Page>
  );
}
