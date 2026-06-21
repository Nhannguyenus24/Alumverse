import { useRef, useState, useMemo } from "react";
import { z } from "zod";
import dayjs from "dayjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useSnackbar } from "notistack";
import {
  alpha,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import PublishOutlinedIcon from "@mui/icons-material/PublishOutlined";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import Page from "../../components/Page";
import Breadcrumb from "../../components/Breadcrumb";
import MoneyField from "../../components/MoneyField";
import WYSIWYG from "../../components/WYSIWYG";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";
import { useCreateFund } from "../../hooks/news/useCreateFund";
import { useFundReceivingInfos } from "../../hooks/news/useFundReceivingInfos";
import { useUploadImage, validateImageFile, IMAGE_ACCEPT } from "../../utils/imageUtils";
import useOrganizationStore from "../../stores/organizationStore";

const isEmptyHtml = (html) => {
  if (!html || typeof html !== "string") return true;
  const stripped = html.replace(/<[^>]*>/g, "").trim();
  return stripped.length === 0;
};

const buildSchema = (minStartTime) =>
  z
    .object({
      fundName: z.string().trim().min(1, "Vui lòng nhập tên quỹ quyên góp"),
      organizer: z.string().trim().min(1, "Vui lòng nhập người tổ chức"),
      fundReceivingInfoId: z.coerce
        .number()
        .int()
        .positive("Vui lòng chọn tài khoản nhận quỹ"),
      targetAmount: z.coerce
        .number({ message: "Mục tiêu quyên góp phải là số" })
        .positive("Mục tiêu quyên góp phải lớn hơn 0"),
      descriptionShort: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập mô tả ngắn")
        .max(120, "Mô tả ngắn tối đa 120 ký tự"),
      descriptionFull: z
        .string()
        .refine((v) => !isEmptyHtml(v), "Vui lòng nhập mô tả đầy đủ"),
      startDate: z
        .custom((v) => v === null || dayjs.isDayjs(v), {
          message: "Vui lòng chọn thời gian bắt đầu",
        })
        .refine((v) => v !== null, "Vui lòng chọn thời gian bắt đầu"),
      endDate: z
        .custom((v) => v === null || dayjs.isDayjs(v), {
          message: "Vui lòng chọn thời gian kết thúc",
        })
        .refine((v) => v !== null, "Vui lòng chọn thời gian kết thúc"),
    })
    .superRefine(({ startDate, endDate }, ctx) => {
      if (!dayjs.isDayjs(startDate) || !dayjs.isDayjs(endDate)) return;
      if (startDate.isBefore(minStartTime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Thời gian bắt đầu phải từ hiện tại + 1 giờ",
          path: ["startDate"],
        });
      }
      if (endDate.isBefore(startDate.add(1, "hour"))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Thời gian kết thúc phải sau thời gian bắt đầu ít nhất 1 giờ",
          path: ["endDate"],
        });
      }
    });

const defaultValues = {
  fundName: "",
  organizer: "",
  fundReceivingInfoId: "",
  targetAmount: "",
  descriptionShort: "",
  descriptionFull: "",
  startDate: null,
  endDate: null,
};

export default function PostArticleDonationPage() {
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { createFund, isPending } = useCreateFund();
  const { uploadFile: uploadLogo, isPending: isUploadingLogo } = useUploadImage();

  const organizationId = useOrganizationStore((s) => s.organization?.id ?? null);
  const { infos: receivingInfos } = useFundReceivingInfos();

  const pickImageFile = (file, onValid, inputEl) => {
    const result = validateImageFile(file);
    if (!result.valid) {
      enqueueSnackbar(result.message, { variant: "warning" });
      if (inputEl) inputEl.value = "";
      return;
    }
    onValid(file);
  };

  // Logo quỹ — upload riêng → POST /images/upload → logoUrl
  const logoInputRef = useRef(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
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
  const handleLogoRemove = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const minStartTime = useMemo(() => dayjs().add(1, "hour"), []);
  const schema = useMemo(() => buildSchema(minStartTime), [minStartTime]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onSubmit",
  });

  const onSubmit = async (values) => {
    if (!organizationId) {
      enqueueSnackbar("Không tìm thấy tổ chức để tạo quỹ", { variant: "error" });
      return;
    }

    try {
      const logoUrl = logoFile ? await uploadLogo(logoFile) : null;

      const payload = {
        name: values.fundName,
        managerName: values.organizer,
        logoUrl: logoUrl ?? null,
        fundReceivingInfoId: Number(values.fundReceivingInfoId),
        targetAmount: Number(values.targetAmount),
        description_short: values.descriptionShort,
        description_full: values.descriptionFull,
        organizationId: Number(organizationId),
        timeStarted: values.startDate.format("YYYY-MM-DDTHH:mm:ss"),
        timeEnded: values.endDate.format("YYYY-MM-DDTHH:mm:ss"),
      };

      const result = await createFund(payload);
      enqueueSnackbar("Tạo quỹ quyên góp thành công.", { variant: "success" });
      navigate(result?.id ? `/donations/${result.id}` : "/donations");
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message || "Tạo quỹ thất bại",
        { variant: "error" }
      );
    }
  };

  const isBusy = isSubmitting || isPending || isUploadingLogo;

  return (
    <Page
      title="Tạo quỹ quyên góp"
      meta={<meta name="description" content="Tạo quỹ quyên góp" />}
    >
      <Box
        sx={{
          minHeight: "100vh",
          py: 5,
          background: (theme) =>
            `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${theme.palette.background.default} 320px)`,
        }}
      >
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 10 }}>
          <Box
            sx={{
              width: { xs: "100%", md: "85%", lg: "75%" },
              mx: "auto",
            }}
          >
            <Breadcrumb
              items={[
                { label: "Quyên góp", path: "/donations" },
                { label: "Tạo quỹ" },
              ]}
              fontSize="0.9rem"
            />

            <Typography
              variant="h1"
              fontWeight={800}
              color="primary.main"
              sx={{ fontSize: { xs: "1.8rem", md: "2.3rem" }, mb: 2.5 }}
            >
              TẠO QUỸ QUYÊN GÓP
            </Typography>

            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 5 },
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                boxShadow: (theme) => `0 10px 26px ${alpha(theme.palette.primary.main, 0.08)}`,
              }}
            >
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                  <Grid container spacing={2.5}>

                    {/* Tên quỹ */}
                    <Grid size={12}>
                      <TextField
                        fullWidth
                        label="Tên quỹ quyên góp"
                        placeholder="Nhập tên quỹ quyên góp"
                        {...register("fundName")}
                        error={!!errors.fundName}
                        helperText={errors.fundName?.message}
                      />
                    </Grid>

                    {/* Người tổ chức */}
                    <Grid size={12}>
                      <TextField
                        fullWidth
                        label="Người tổ chức"
                        placeholder="Nhập tên người tổ chức"
                        {...register("organizer")}
                        error={!!errors.organizer}
                        helperText={errors.organizer?.message}
                      />
                    </Grid>

                    {/* Logo quỹ — upload ảnh riêng */}
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
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        {logoPreview && (
                          <Box
                            component="img"
                            src={logoPreview}
                            alt="Logo preview"
                            sx={{
                              width: 72,
                              height: 72,
                              borderRadius: 2,
                              objectFit: "cover",
                              border: "1px solid",
                              borderColor: "divider",
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <Stack direction="row" spacing={1} alignItems="center">
                          <input
                            ref={logoInputRef}
                            type="file"
                            accept={IMAGE_ACCEPT}
                            style={{ display: "none" }}
                            onChange={handleLogoChange}
                          />
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => logoInputRef.current?.click()}
                            sx={{ textTransform: "none" }}
                          >
                            {logoPreview ? "Đổi ảnh logo" : "Chọn ảnh logo"}
                          </Button>
                          {logoPreview && (
                            <Button
                              variant="text"
                              size="small"
                              color="error"
                              onClick={handleLogoRemove}
                              sx={{ textTransform: "none" }}
                            >
                              Xoá
                            </Button>
                          )}
                        </Stack>
                      </Box>
                    </Grid>

                    {/* Tài khoản nhận */}
                    <Grid size={12}>
                      <FormControl fullWidth error={!!errors.fundReceivingInfoId}>
                        <InputLabel id="receiving-label">Tài khoản nhận quỹ</InputLabel>
                        <Controller
                          name="fundReceivingInfoId"
                          control={control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              labelId="receiving-label"
                              label="Tài khoản nhận quỹ"
                              MenuProps={{ disableScrollLock: true }}
                            >
                              {receivingInfos.map((info) => (
                                <MenuItem key={info.id} value={info.id}>
                                  {`${info.bankName} - ${info.accountName} - ${info.accountNumber}`}
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        />
                        <FormHelperText>{errors.fundReceivingInfoId?.message}</FormHelperText>
                      </FormControl>
                    </Grid>

                    {/* Số tiền mục tiêu */}
                    <Grid size={12}>
                      <Controller
                        name="targetAmount"
                        control={control}
                        render={({ field }) => (
                          <MoneyField
                            fullWidth
                            label="Số tiền mục tiêu để quyên góp (VNĐ)"
                            placeholder="Nhập số tiền mục tiêu"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            error={!!errors.targetAmount}
                            helperText={errors.targetAmount?.message}
                          />
                        )}
                      />
                    </Grid>

                    {/* Thời gian bắt đầu + kết thúc */}
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

                    {/* Mô tả ngắn */}
                    <Grid size={12}>
                      <TextField
                        fullWidth
                        label="Mô tả ngắn (tối đa 120 ký tự)"
                        placeholder="Nhập mô tả ngắn"
                        inputProps={{ maxLength: 120 }}
                        {...register("descriptionShort")}
                        error={!!errors.descriptionShort}
                        helperText={errors.descriptionShort?.message}
                      />
                    </Grid>

                    {/* Mô tả đầy đủ — WYSIWYG */}
                    <Grid size={12}>
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
                            height={320}
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

                  </Grid>

                  <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mt: 4 }}>
                    <Button
                      variant="outlined"
                      startIcon={<CloseOutlinedIcon />}
                      onClick={() => navigate(-1)}
                      disabled={isBusy}
                      sx={{ textTransform: "none", px: 3 }}
                    >
                      Huỷ
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={isUploadingLogo ? <CircularProgress size={16} color="inherit" /> : <PublishOutlinedIcon />}
                      disabled={isBusy}
                      sx={{ textTransform: "none", px: 3 }}
                    >
                      {isUploadingLogo
                        ? "Đang tải ảnh..."
                        : isBusy
                        ? "Đang đăng..."
                        : "Đăng quyên góp"}
                    </Button>
                  </Stack>
                </Box>
              </LocalizationProvider>
            </Paper>
          </Box>
        </Container>
      </Box>
    </Page>
  );
}
