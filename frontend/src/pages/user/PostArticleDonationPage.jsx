import { useRef, useState, useMemo } from "react";
import { z } from "zod";
import dayjs from "dayjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import {
  alpha,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { useOrgNavigate } from "../../hooks/useOrgNavigate";
import { useCreateFund } from "../../hooks/news/useCreateFund";
import { useFundReceivingInfos } from "../../hooks/news/useFundReceivingInfos";
import {
  fileToBase64,
  validateImageFile,
  validateFundDocumentFile,
  IMAGE_ACCEPT,
  FUND_DOCUMENT_ACCEPT,
  FUND_CONTENT_EDITOR_HEIGHT,
} from "../../utils/imageUtils";
import useOrganizationStore from "../../stores/organizationStore";
import { getStaggerDelay } from "../../components/animations/ScrollReveal";

const AnimatedGridItem = ({ index, children, ...props }) => (
  <Grid {...props}>
    <ScrollReveal delay={getStaggerDelay(index, 0.06)}>{children}</ScrollReveal>
  </Grid>
);

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
      managerEmail: z.string().trim().min(1, msgs.managerEmailRequired).email(msgs.managerEmailInvalid),
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
  managerEmail: "",
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

  // Logo quỹ — gửi thẳng base64 trong payload tạo quỹ (backend convert WebP + lưu)
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

  // Tài liệu quỹ (PDF/DOC/DOCX) — tuỳ chọn, gửi thẳng base64 trong payload tạo quỹ
  const documentInputRef = useRef(null);
  const [documentFile, setDocumentFile] = useState(null);
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
    if (documentInputRef.current) documentInputRef.current.value = "";
  };

  const minStartTime = useMemo(() => dayjs().add(1, "hour"), []);

  const validationMsgs = useMemo(() => ({
    fundName:             t("validation_fund_name"),
    organizer:            t("validation_organizer"),
    managerEmailRequired: t("validation_manager_email_required"),
    managerEmailInvalid:  t("validation_manager_email_invalid"),
    receivingInfo:        t("validation_receiving_info"),
    targetNumber:         t("validation_target_number"),
    targetPositive:       t("validation_target_positive"),
    descShort:            t("validation_desc_short"),
    descShortMax:         t("validation_desc_short_max"),
    descFull:             t("validation_desc_full"),
    startDate:            t("validation_start_date"),
    endDate:              t("validation_end_date"),
    startDateMin:         t("validation_start_date_min"),
    endDateMin:           t("validation_end_date_min"),
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
      const logoBase64 = logoFile ? await fileToBase64(logoFile) : null;
      const fundDocumentBase64 = documentFile ? await fileToBase64(documentFile) : null;

      const payload = {
        name: values.fundName,
        managerName: values.organizer,
        managerEmail: values.managerEmail.trim(),
        logoBase64: logoBase64 ?? undefined,
        fundDocumentBase64: fundDocumentBase64 ?? undefined,
        fundDocumentFileName: documentFile?.name,
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

  const isBusy = isSubmitting || isPending;

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
            <ScrollReveal><Breadcrumb
              items={[
                { label: t("breadcrumb_list"), path: "/donations" },
                { label: t("breadcrumb_create") },
              ]}
              fontSize="0.9rem"
            /></ScrollReveal>

            <ScrollReveal delay={0.06}><Typography
              variant="h1"
              fontWeight={800}
              color="primary.main"
              sx={{ fontSize: { xs: "1.8rem", md: "2.3rem" }, mb: 2.5 }}
            >
              {t("create_heading")}
            </Typography></ScrollReveal>

            <ScrollReveal delay={0.1}><Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 5 },
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                  <Grid container spacing={2.5}>

                    {/* Tên quỹ */}
                    <AnimatedGridItem index={0} size={12}>
                      <TextField
                        fullWidth
                        label={t("field_fund_name_label")}
                        placeholder={t("field_fund_name_placeholder")}
                        {...register("fundName")}
                        error={!!errors.fundName}
                        helperText={errors.fundName?.message}
                      />
                    </AnimatedGridItem>

                    {/* Người tổ chức */}
                    <AnimatedGridItem index={1} size={12}>
                      <TextField
                        fullWidth
                        label={t("field_organizer_label")}
                        placeholder={t("field_organizer_placeholder")}
                        {...register("organizer")}
                        error={!!errors.organizer}
                        helperText={errors.organizer?.message}
                      />
                    </AnimatedGridItem>

                    {/* Email người phụ trách */}
                    <AnimatedGridItem index={2} size={12}>
                      <TextField
                        fullWidth
                        required
                        label={t("field_manager_email_label")}
                        placeholder={t("field_manager_email_placeholder")}
                        type="email"
                        {...register("managerEmail")}
                        error={!!errors.managerEmail}
                        helperText={errors.managerEmail?.message}
                      />
                    </AnimatedGridItem>

                    {/* Logo quỹ — upload ảnh riêng */}
                    <AnimatedGridItem index={3} size={12}>
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
                    </AnimatedGridItem>

                    {/* Tài liệu quỹ — upload PDF/DOC/DOCX (tuỳ chọn) */}
                    <AnimatedGridItem index={4} size={12}>
                      <Typography
                        variant="body2"
                        sx={{ mb: 1.2, fontWeight: 600, color: "text.secondary" }}
                      >
                        {t("field_fund_document_label")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                        {t("field_fund_document_hint")}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <input
                          ref={documentInputRef}
                          type="file"
                          accept={FUND_DOCUMENT_ACCEPT}
                          style={{ display: "none" }}
                          onChange={handleDocumentChange}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => documentInputRef.current?.click()}
                          sx={{ textTransform: "none" }}
                        >
                          {documentFile ? t("field_fund_document_change") : t("field_fund_document_choose")}
                        </Button>
                        {documentFile && (
                          <>
                            <Typography variant="body2" sx={{ color: "text.primary", wordBreak: "break-all" }}>
                              {documentFile.name}
                            </Typography>
                            <Button
                              variant="text"
                              size="small"
                              color="primary"
                              onClick={handleDocumentRemove}
                              sx={{ textTransform: "none" }}
                            >
                              {t("field_fund_document_remove")}
                            </Button>
                          </>
                        )}
                      </Stack>
                    </AnimatedGridItem>

                    {/* Tài khoản nhận */}
                    <AnimatedGridItem index={5} size={12}>
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
                    </AnimatedGridItem>

                    {/* Số tiền mục tiêu */}
                    <AnimatedGridItem index={6} size={12}>
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
                    </AnimatedGridItem>

                    {/* Thời gian bắt đầu + kết thúc */}
                    <AnimatedGridItem index={7} size={{ xs: 12, md: 6 }}>
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
                    </AnimatedGridItem>

                    <AnimatedGridItem index={8} size={{ xs: 12, md: 6 }}>
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
                    </AnimatedGridItem>

                    {/* Mô tả ngắn */}
                    <AnimatedGridItem index={9} size={12}>
                      <TextField
                        fullWidth
                        label={t("field_desc_short_label")}
                        placeholder={t("field_desc_short_placeholder")}
                        inputProps={{ maxLength: 120 }}
                        {...register("descriptionShort")}
                        error={!!errors.descriptionShort}
                        helperText={errors.descriptionShort?.message}
                      />
                    </AnimatedGridItem>

                    {/* Mô tả đầy đủ — WYSIWYG */}
                    <AnimatedGridItem index={10} size={12}>
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
                    </AnimatedGridItem>

                  </Grid>

                  <ScrollReveal><Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mt: 4 }}>
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
                      startIcon={isBusy ? <CircularProgress size={16} color="inherit" /> : <PublishOutlinedIcon />}
                      disabled={isBusy}
                      sx={{ textTransform: "none", px: 3 }}
                    >
                      {isBusy ? t("btn_submitting") : t("btn_submit")}
                    </Button>
                  </Stack></ScrollReveal>
                </Box>
              </LocalizationProvider>
            </Paper></ScrollReveal>
          </Box>
        </Container>
      </Box>
    </Page>
  );
}
