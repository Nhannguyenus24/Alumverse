import { useRef, useState, useMemo } from "react";
import { z } from "zod";
import dayjs from "dayjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import {
  alpha,
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Paper,
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
import FundReceivingInfoSelect from "../../components/FundReceivingInfoSelect";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";
import { useCreateFund } from "../../hooks/news/useCreateFund";
import { useFundReceivingInfos } from "../../hooks/news/useFundReceivingInfos";
import FundLogoPreview from "../../components/FundLogoPreview";
import { useUploadImage, validateImageFile, IMAGE_ACCEPT, FUND_CONTENT_EDITOR_HEIGHT } from "../../utils/imageUtils";
import useOrganizationStore from "../../stores/organizationStore";

const isEmptyHtml = (html) => {
  if (!html || typeof html !== "string") return true;
  const stripped = html.replace(/<[^>]*>/g, "").trim();
  return stripped.length === 0;
};

const buildSchema = (minStartTime, msgs) =>
  z
    .object({
      fundName: z.string().trim().min(1, msgs.fundName),
      organizer: z.string().trim().min(1, msgs.organizer),
      fundReceivingInfoId: z.coerce
        .number()
        .int()
        .positive(msgs.receivingInfo),
      targetAmount: z.coerce
        .number({ message: msgs.targetNumber })
        .positive(msgs.targetPositive),
      descriptionShort: z
        .string()
        .trim()
        .min(1, msgs.descShort)
        .max(120, msgs.descShortMax),
      descriptionFull: z
        .string()
        .refine((v) => !isEmptyHtml(v), msgs.descFull),
      startDate: z
        .custom((v) => v === null || dayjs.isDayjs(v), {
          message: msgs.startDate,
        })
        .refine((v) => v !== null, msgs.startDate),
      endDate: z
        .custom((v) => v === null || dayjs.isDayjs(v), {
          message: msgs.endDate,
        })
        .refine((v) => v !== null, msgs.endDate),
    })
    .superRefine(({ startDate, endDate }, ctx) => {
      if (!dayjs.isDayjs(startDate) || !dayjs.isDayjs(endDate)) return;
      if (startDate.isBefore(minStartTime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: msgs.startDateMin,
          path: ["startDate"],
        });
      }
      if (endDate.isBefore(startDate.add(1, "hour"))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: msgs.endDateMin,
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
  const { t } = useTranslation("donation");
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

  const validationMsgs = useMemo(() => ({
    fundName:      t("validation_fund_name"),
    organizer:     t("validation_organizer"),
    receivingInfo: t("validation_receiving_info"),
    targetNumber:  t("validation_target_number"),
    targetPositive:t("validation_target_positive"),
    descShort:     t("validation_desc_short"),
    descShortMax:  t("validation_desc_short_max"),
    descFull:      t("validation_desc_full"),
    startDate:     t("validation_start_date"),
    endDate:       t("validation_end_date"),
    startDateMin:  t("validation_start_date_min"),
    endDateMin:    t("validation_end_date_min"),
  }), [t]);

  const schema = useMemo(
    () => buildSchema(minStartTime, validationMsgs),
    [minStartTime, validationMsgs],
  );

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
      enqueueSnackbar(t("error_no_org"), { variant: "error" });
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
      enqueueSnackbar(t("create_success"), { variant: "success" });
      navigate(result?.id ? `/donations/${result.id}` : "/donations");
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message || t("create_failed"),
        { variant: "error" }
      );
    }
  };

  const isBusy = isSubmitting || isPending || isUploadingLogo;

  return (
    <Page
      title={t("create_page_title")}
      meta={<meta name="description" content={t("create_page_meta")} />}
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
                { label: t("breadcrumb_list"), path: "/donations" },
                { label: t("breadcrumb_create") },
              ]}
              fontSize="0.9rem"
            />

            <Typography
              variant="h1"
              fontWeight={800}
              color="primary.main"
              sx={{ fontSize: { xs: "1.8rem", md: "2.3rem" }, mb: 2.5 }}
            >
              {t("create_heading")}
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
                        label={t("field_fund_name_label")}
                        placeholder={t("field_fund_name_placeholder")}
                        {...register("fundName")}
                        error={!!errors.fundName}
                        helperText={errors.fundName?.message}
                      />
                    </Grid>

                    {/* Người tổ chức */}
                    <Grid size={12}>
                      <TextField
                        fullWidth
                        label={t("field_organizer_label")}
                        placeholder={t("field_organizer_placeholder")}
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
                        {t("field_logo_label")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                        {t("field_logo_hint")}
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
                          />
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => logoInputRef.current?.click()}
                            sx={{ textTransform: "none" }}
                          >
                            {logoPreview ? t("field_logo_change") : t("field_logo_choose")}
                          </Button>
                          {logoPreview && (
                            <Button
                              variant="text"
                              size="small"
                              color="primary"
                              onClick={handleLogoRemove}
                              sx={{ textTransform: "none" }}
                            >
                              {t("field_logo_remove")}
                            </Button>
                          )}
                        </Stack>
                      </Box>
                    </Grid>

                    {/* Tài khoản nhận */}
                    <Grid size={12}>
                      <Controller
                        name="fundReceivingInfoId"
                        control={control}
                        render={({ field }) => (
                          <FundReceivingInfoSelect
                            value={field.value}
                            onChange={field.onChange}
                            options={receivingInfos}
                            error={!!errors.fundReceivingInfoId}
                            helperText={errors.fundReceivingInfoId?.message}
                            labelId="receiving-label"
                          />
                        )}
                      />
                    </Grid>

                    {/* Số tiền mục tiêu */}
                    <Grid size={12}>
                      <Controller
                        name="targetAmount"
                        control={control}
                        render={({ field }) => (
                          <MoneyField
                            fullWidth
                            label={t("field_target_label")}
                            placeholder={t("field_target_placeholder")}
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
                            label={t("field_start_date_label")}
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
                            label={t("field_end_date_label")}
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
                        label={t("field_desc_short_label")}
                        placeholder={t("field_desc_short_placeholder")}
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
                        {t("field_desc_full_label")}
                      </Typography>
                      <Controller
                        name="descriptionFull"
                        control={control}
                        render={({ field }) => (
                          <WYSIWYG
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={t("field_desc_full_placeholder")}
                            height={FUND_CONTENT_EDITOR_HEIGHT}
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
                      {t("btn_cancel")}
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={isUploadingLogo ? <CircularProgress size={16} color="inherit" /> : <PublishOutlinedIcon />}
                      disabled={isBusy}
                      sx={{ textTransform: "none", px: 3 }}
                    >
                      {isUploadingLogo
                        ? t("btn_uploading")
                        : isBusy
                        ? t("btn_submitting")
                        : t("btn_submit")}
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
