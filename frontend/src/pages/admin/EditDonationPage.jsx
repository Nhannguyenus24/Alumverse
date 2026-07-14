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
import { alpha } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { useParams } from "react-router";
import Page from "../../components/Page";
import WYSIWYG from "../../components/WYSIWYG";
import FundReceivingInfoSelect from "../../components/FundReceivingInfoSelect";
import { fundApi } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";
import Breadcrumb from "../../components/Breadcrumb";
import MoneyField from "../../components/MoneyField";
import FundLogoPreview from "../../components/FundLogoPreview";
import {
  fileToBase64,
  validateImageFile,
  validateFundDocumentFile,
  IMAGE_ACCEPT,
  FUND_DOCUMENT_ACCEPT,
  FUND_CONTENT_EDITOR_HEIGHT,
} from "../../utils/imageUtils";

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
      managerEmail: z.string().trim().min(1, t('donation:validation_manager_email_required')).email(t('donation:validation_manager_email_invalid')),
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
  const { user } = useAuth();
  const isStaff = user?.role === "STAFF";
  const [receivingOptions, setReceivingOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const logoInputRef = useRef(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const documentInputRef = useRef(null);
  const [documentFile, setDocumentFile] = useState(null);
  // Currently stored document URL; "" means "no document / remove on save".
  const [documentUrl, setDocumentUrl] = useState("");

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
      managerEmail: "",
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

  const handleDocumentChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = validateFundDocumentFile(file, t);
    if (!result.valid) {
      enqueueSnackbar(result.message, { variant: "warning" });
      e.target.value = "";
      return;
    }
    setDocumentFile(file);
  };

  const handleDocumentRemove = () => {
    setDocumentFile(null);
    setDocumentUrl("");
    if (documentInputRef.current) documentInputRef.current.value = "";
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
        setDocumentFile(null);
        setDocumentUrl(detail?.fundDocumentUrl ?? "");
        reset({
          name: normalizedDetail.name,
          managerName: detail?.managerName ?? "",
          managerEmail: detail?.managerEmail ?? "",
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
  // STAFF may only edit managerName, managerEmail, descriptionFull — every other field is locked.
  const lockForStaff = isStaff;

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
      if (isStaff) {
        await fundApi.updateFundBasicInfo(id, {
          managerName: values.managerName?.trim(),
          managerEmail: values.managerEmail?.trim(),
          description_full: values.descriptionFull,
        });
      } else {
        // A newly chosen logo is sent inline as base64 (backend converts to WebP + stores);
        // otherwise the backend keeps the current logo.
        const logoBase64 = logoFile ? await fileToBase64(logoFile) : undefined;

        // A newly chosen document is sent inline as base64; otherwise keep the current one, unless
        // the user cleared it (documentUrl === "") in which case ask the backend to remove it.
        const fundDocumentBase64 = documentFile ? await fileToBase64(documentFile) : undefined;
        const removeFundDocument = !documentFile && !documentUrl?.trim();

        const payload = {
          name: values.name?.trim(),
          managerName: values.managerName?.trim(),
          managerEmail: values.managerEmail?.trim(),
          logoBase64,
          fundDocumentBase64,
          fundDocumentFileName: documentFile?.name,
          removeFundDocument,
          description_short: values.descriptionShort?.trim(),
          description_full: values.descriptionFull,
          targetAmount: Number(values.targetAmount),
          fundReceivingInfoId: Number(values.fundReceivingInfoId),
          timeStarted: values.startDate?.format("YYYY-MM-DDTHH:mm:ss"),
          timeEnded: values.endDate?.format("YYYY-MM-DDTHH:mm:ss"),
        };

        await fundApi.updateFund(id, payload);
      }
      enqueueSnackbar(t('admin:edit_fund_success'), { variant: "success" });
      navigate(`/donations/${id}`);
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || t('admin:edit_fund_error'), {
        variant: "error",
      });
    }
  };

  const isBusy = isSubmitting;

  return (
    <Page title={t('admin:edit_fund_page_title')} meta={<meta name="description" content={t('admin:edit_fund_page_title')} />}>
      <Box sx={{ py: { xs: 4, md: 6 }, backgroundColor: "background.default", minHeight: "100vh" }}>
        <Container maxWidth={false} sx={{ maxWidth: 1160 }}>
            <Breadcrumb
              items={[
                { label: t('donation:title'), path: "/donations" },
                { label: donationDetail.name || `Donation ${id}`, path: `/donations/${id}` },
                { label: t('admin:edit_fund_breadcrumb') },
              ]}
              fontSize="0.9rem"
            />

          <Typography variant="h1" sx={{ mb: 2.5, fontWeight: 800, color: "primary.main" }}>
            {t('admin:edit_fund_heading')}
          </Typography>
          <Box
            sx={(theme) => ({
              mb: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.3 : 0.18),
              backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.14 : 0.08),
              px: { xs: 2, md: 2.5 },
              py: { xs: 1.5, md: 1.8 },
            })}
          >
            <Typography sx={{ color: "primary.main", fontWeight: 900, fontSize: "0.95rem", letterSpacing: 0.3 }}>
              {t('admin:edit_fund_note_label')}
            </Typography>
            <Typography sx={{ mt: 0.3, color: "text.primary", fontWeight: 600, lineHeight: 1.6 }}>{noteMessage}</Typography>
            {isStaff && (
              <Typography sx={{ mt: 0.6, color: "text.primary", fontWeight: 600, lineHeight: 1.6 }}>
                {t('admin:edit_fund_staff_note')}
              </Typography>
            )}
          </Box>

          {isLoading && <LinearProgress sx={{ mb: 2.2 }} />}

          <Box sx={{ maxWidth: 940, mx: "auto" }}>
            <Card
              sx={(theme) => ({
                borderRadius: 3,
                p: { xs: 2.5, sm: 3.5, md: 4 },
                border: "1px solid",
                borderColor: "divider",
                boxShadow: theme.palette.mode === "dark"
                  ? "0 18px 42px rgba(0, 0, 0, 0.26)"
                  : "0 14px 34px rgba(15, 58, 122, 0.08)",
                backgroundColor: "background.paper",
              })}
            >
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={2}>
                      <Grid size={12}>
                        <TextField fullWidth label={t('donation:fund_name')} InputLabelProps={{ shrink: true }} {...register("name")} disabled={disableAllFields || lockForStaff} error={!!errors.name} helperText={errors.name?.message} />
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
                        <TextField
                          fullWidth
                          required
                          type="email"
                          label={t('donation:field_manager_email_label')}
                          placeholder={t('donation:field_manager_email_placeholder')}
                          InputLabelProps={{ shrink: true }}
                          {...register("managerEmail")}
                          disabled={disableAllFields}
                          error={!!errors.managerEmail}
                          helperText={errors.managerEmail?.message}
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
                              disabled={disableAllFields || lockForStaff}
                            />
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => logoInputRef.current?.click()}
                              disabled={disableAllFields || lockForStaff}
                              sx={{ textTransform: "none" }}
                            >
                              {logoPreview ? t('admin:edit_fund_logo_change') : t('admin:edit_fund_logo_select')}
                            </Button>
                          </Stack>
                        </Box>
                      </Grid>
                      <Grid size={12}>
                        <Typography
                          variant="body2"
                          sx={{ mb: 1.2, fontWeight: 600, color: "text.secondary" }}
                        >
                          {t('admin:edit_fund_document_label')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                          {t('admin:edit_fund_document_hint')}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                          {documentFile ? (
                            <Typography variant="body2" sx={{ color: "text.primary", wordBreak: "break-all" }}>
                              {documentFile.name}
                            </Typography>
                          ) : documentUrl ? (
                            <Button
                              variant="text"
                              size="small"
                              component="a"
                              href={documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ textTransform: "none" }}
                            >
                              {t('admin:edit_fund_document_view')}
                            </Button>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              {t('admin:edit_fund_document_none')}
                            </Typography>
                          )}
                          {!lockForStaff && (
                            <>
                              <input
                                ref={documentInputRef}
                                type="file"
                                accept={FUND_DOCUMENT_ACCEPT}
                                style={{ display: "none" }}
                                onChange={handleDocumentChange}
                                disabled={disableAllFields}
                              />
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => documentInputRef.current?.click()}
                                disabled={disableAllFields}
                                sx={{ textTransform: "none" }}
                              >
                                {documentFile || documentUrl
                                  ? t('admin:edit_fund_document_change')
                                  : t('admin:edit_fund_document_select')}
                              </Button>
                              {(documentFile || documentUrl) && (
                                <Button
                                  variant="text"
                                  size="small"
                                  color="primary"
                                  onClick={handleDocumentRemove}
                                  disabled={disableAllFields}
                                  sx={{ textTransform: "none" }}
                                >
                                  {t('admin:edit_fund_document_remove')}
                                </Button>
                              )}
                            </>
                          )}
                        </Stack>
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
                          disabled={disableAllFields || lockForStaff}
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
                              disabled={disableTargetAmount || lockForStaff}
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
                              disabled={disableFundReceivingInfo || lockForStaff}
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
                              disabled={disableStartDate || lockForStaff}
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
                              disabled={disableEndDate || lockForStaff}
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
                        startIcon={isBusy ? <CircularProgress size={16} color="inherit" /> : null}
                        sx={{ textTransform: "none", px: 2.6 }}
                      >
                        {isBusy ? t('admin:edit_fund_btn_saving') : t('admin:edit_fund_btn_save')}
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
