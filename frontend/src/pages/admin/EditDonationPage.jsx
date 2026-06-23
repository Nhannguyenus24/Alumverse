import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import dayjs from "dayjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
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

const buildEditSchema = ({ minAllowedTime, phase, originalStartDate, originalEndDate, originalTargetAmount, t }) =>
  z
    .object({
      name: z.string().trim().min(1, t('admin:edit_fund_name_required')),
      managerName: z.string().trim().min(1, t('admin:edit_fund_manager_required')),
      descriptionShort: z
        .string()
        .trim()
        .min(1, t('admin:edit_fund_short_desc_required'))
        .max(100, t('admin:edit_fund_short_desc_max')),
      descriptionFull: z
        .string()
        .refine((value) => !isEmptyHtml(value), t('admin:edit_fund_desc_required')),
      targetAmount: z.coerce.number({ message: t('admin:edit_fund_target_not_number') }).positive(t('admin:edit_fund_target_positive')),
      fundReceivingInfoId: z.coerce.number().int().positive(t('admin:edit_fund_account_required')),
      startDate: z
        .custom((value) => value === null || dayjs.isDayjs(value), {
          message: t('admin:edit_fund_start_required'),
        })
        .refine((value) => value !== null, t('admin:edit_fund_start_required')),
      endDate: z
        .custom((value) => value === null || dayjs.isDayjs(value), {
          message: t('admin:edit_fund_end_required'),
        })
        .refine((value) => value !== null, t('admin:edit_fund_end_required')),
    })
    .superRefine((data, ctx) => {
      const start = data.startDate;
      const end = data.endDate;
      if (!dayjs.isDayjs(start) || !dayjs.isDayjs(end)) return;

      if (!end.isAfter(start, "minute")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endDate"],
          message: t('admin:edit_fund_end_before_start'),
        });
      }

      if (phase === "before_start" && start.isBefore(minAllowedTime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["startDate"],
          message: t('admin:edit_fund_start_too_soon'),
        });
      }

      if (phase === "active") {
        if (!start.isSame(originalStartDate)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["startDate"],
            message: t('admin:edit_fund_active_start_locked'),
          });
        }
        if (end.isBefore(minAllowedTime)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["endDate"],
            message: t('admin:edit_fund_active_end_too_soon'),
          });
        }
        if (data.targetAmount !== originalTargetAmount) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["targetAmount"],
            message: t('admin:edit_fund_active_target_locked'),
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
          message: t('admin:edit_fund_closed_locked'),
        });
      }
    });

export default function EditDonationPage() {
  const { t } = useTranslation(['admin', 'donation']);
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
        t,
      }),
    [donationDetail.endDate, donationDetail.startDate, donationDetail.targetAmount, minAllowedTime, phase, t]
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
        enqueueSnackbar(error?.response?.data?.message || t('donation:error_load_fund_detail'), {
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
    before_start: t('admin:edit_fund_note_before_start'),
    active: t('admin:edit_fund_note_active'),
    ended: t('admin:edit_fund_note_ended'),
    invalid: t('admin:edit_fund_note_invalid'),
  }[phase];

  const onSubmit = async (values) => {
    if (disableAllFields) {
      enqueueSnackbar(t('admin:edit_fund_note_ended'), { variant: "warning" });
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
      enqueueSnackbar(t('admin:edit_fund_success'), { variant: "success" });
      navigate(`/donations/${id}`);
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || t('admin:edit_fund_error'), {
        variant: "error",
      });
    }
  };

  const isBusy = isSubmitting || isUploadingLogo;

  return (
    <Page title={t('admin:edit_fund_page_title')} meta={<meta name="description" content={t('admin:edit_fund_page_title')} />}>
      <Box sx={{ py: 5, backgroundColor: "#f3f5f9", minHeight: "100vh" }}>
        <Container maxWidth={false} sx={{ maxWidth: 1160 }}>
            <Breadcrumb
              items={[
                { label: t('donation:title'), path: "/donations" },
                { label: donationDetail.name || `Donation ${id}`, path: `/donations/${id}` },
                { label: t('admin:edit_fund_breadcrumb') },
              ]}
              fontSize="0.9rem"
            />

          <Typography variant="h1" sx={{ mb: 2.5, fontWeight: 800, color: "#123661" }}>
            {t('admin:edit_fund_heading')}
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
              {t('admin:edit_fund_note_label')}
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
                        <TextField fullWidth label={t('donation:fund_name')} InputLabelProps={{ shrink: true }} {...register("name")} disabled={disableAllFields} error={!!errors.name} helperText={errors.name?.message} />
                      </Grid>
                      <Grid size={12}>
                        <TextField
                          fullWidth
                          label={t('donation:manager_label')}
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
                          {t('admin:edit_fund_logo_label')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                          {t('admin:edit_fund_logo_hint')}
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
                              {logoPreview ? t('admin:edit_fund_logo_change') : t('admin:edit_fund_logo_select')}
                            </Button>
                          </Stack>
                        </Box>
                      </Grid>
                      <Grid size={12}>
                        <TextField
                          fullWidth
                          multiline
                          minRows={2}
                          label={t('admin:edit_fund_desc_short_label')}
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
                          {t('admin:edit_fund_desc_full_label')}
                        </Typography>
                        <Controller
                          name="descriptionFull"
                          control={control}
                          render={({ field }) => (
                            <WYSIWYG
                              value={field.value}
                              onChange={field.onChange}
                              placeholder={t('admin:edit_fund_desc_full_placeholder')}
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
                              label={t('donation:goal_vnd')}
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
                              label={t('donation:start_date_label')}
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
                              label={t('donation:end_date_label')}
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
                        {t('admin:edit_fund_btn_cancel')}
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={isBusy || disableAllFields}
                        startIcon={isUploadingLogo ? <CircularProgress size={16} color="inherit" /> : null}
                        sx={{ textTransform: "none", px: 2.6 }}
                      >
                        {isUploadingLogo ? t('admin:edit_fund_btn_uploading') : isBusy ? t('admin:edit_fund_btn_saving') : t('admin:edit_fund_btn_save')}
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
