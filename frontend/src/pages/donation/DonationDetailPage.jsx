import { useEffect, useMemo, useState } from "react";
import { Box, Button, Card, Container, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Switch, TextField, Typography, LinearProgress } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import Page from "../../components/Page";
import MoneyField from "../../components/MoneyField";
import { VIETNAM_PHONE_REGEX } from "../../utils/regexUtils";
import { fundApi } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import { useCanContribute } from "../../hooks/useCanContribute";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";
import Breadcrumb from "../../components/Breadcrumb";
import { ScrollReveal } from "../../components/animations/ScrollReveal";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useSupportedBanks } from "../../hooks/fundraising/useSupportedBanks";

const getDonationSchema = (t) => z.object({
  amountOption: z.string().min(1, t('donation:amount_required')),
  customAmount: z.coerce.number().optional(),
  isAnonymous: z.boolean().default(false),
  donorName: z.string().trim().max(50, t('donation:name_max_length')).optional().or(z.literal("")),
  email: z.string().trim().max(255, t('donation:email_max_length')).optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || VIETNAM_PHONE_REGEX.test(v), {
      message: t('donation:phone_invalid'),
    }),
  address: z.string().trim().max(500, t('donation:address_max_length')).optional().or(z.literal("")),
  message: z.string().trim().max(100, t('donation:message_max_length')).optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  if (data.amountOption === "custom") {
    if (!data.customAmount || Number.isNaN(data.customAmount) || data.customAmount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customAmount"],
        message: t('donation:custom_amount_invalid'),
      });
    }
  }

  if (!data.isAnonymous && (!data.donorName || data.donorName.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["donorName"],
      message: t('donation:donor_name_required'),
    });
  }

  if (!data.isAnonymous && data.email && !z.string().email().safeParse(data.email).success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["email"],
      message: t('donation:email_invalid'),
    });
  }
});

const LOGO_FALLBACK_URL = "https://placehold.co/220x220/eef3ff/0f3a7a?text=HCMUS";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "background.default",
  },
};

const CircleLogo = ({ src, alt }) => (
  <Box
    component="img"
    src={src}
    alt={alt}
    sx={{
      width: 116,
      height: 116,
      borderRadius: "50%",
      objectFit: "cover",
      border: "1px solid",
      borderColor: "divider",
    }}
  />
);

function DonationHeaderCard({ fundDetail }) {
  const { t } = useTranslation('donation');
  return (
    <Card variant="outlined" sx={{ px: { xs: 2.5, md: 4 }, py: { xs: 3.5, md: 4.5 }, mb: 3 }}>
      <Box sx={{ textAlign: "center" }}>
        <CircleLogo src={fundDetail?.logoUrl || LOGO_FALLBACK_URL} alt="HCMUS Alumni logo" />
        <Typography variant="h4" sx={{ mt: 2.2, fontWeight: 800, color: "primary.main", fontSize: { xs: "1.6rem", md: "2rem" } }}>
          {fundDetail?.name || t('fund_detail')}
        </Typography>
      </Box>
    </Card>
  );
}

const FIXED_DONATION_AMOUNTS = [
  { value: "100000", label: "100,000 VND" },
  { value: "200000", label: "200,000 VND" },
  { value: "500000", label: "500,000 VND" },
  { value: "1000000", label: "1,000,000 VND" },
];

function DonationContributionForm({ fundDetail }) {
  const { t } = useTranslation('donation');
  const DONATION_AMOUNTS = [
    ...FIXED_DONATION_AMOUNTS,
    { value: "custom", label: t('amount_custom') },
  ];
  const { user, isAuthenticated } = useAuth();
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [isCheckoutPopupOpen, setIsCheckoutPopupOpen] = useState(false);
  const [isQrFailed, setIsQrFailed] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const { getBankLabel } = useSupportedBanks();
  const receivingInfo = fundDetail?.fundReceivingInfo;

  const donationSchema = useMemo(() => getDonationSchema(t), [t]);

  const { control, watch, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      amountOption: "", customAmount: "", isAnonymous: false, donorName: "", email: "", phone: "", address: "", message: "",
    },
  });

  const selectedAmountOption = watch("amountOption");
  const isAnonymous = watch("isAnonymous");

  // Bước 1: form hợp lệ -> mở dialog xác nhận thông tin quỹ + tài khoản nhận,
  // chưa gọi API. Người dùng bấm Confirm mới thực sự tạo donation + hiện QR.
  const openConfirm = (data) => {
    setSubmitError("");
    setPendingData(data);
    setIsConfirmOpen(true);
  };

  const handleConfirmDonation = () => {
    if (pendingData) {
      submitDonation(pendingData);
    }
  };

  const submitDonation = async (data) => {
    setSubmitError("");
    setIsSubmitting(true);
    try {
      const selectedAmount = data.amountOption === "custom" ? data.customAmount : Number(data.amountOption);
      const payload = {
        fundId: Number(fundDetail?.id),
        donor_member_id: isAuthenticated ? user?.id ?? null : null,
        donor_name: data.isAnonymous ? null : data.donorName?.trim() || null,
        amount: selectedAmount,
        address: data.isAnonymous ? null : data.address?.trim() || null,
        phone: data.isAnonymous ? null : data.phone?.trim() || null,
        email: data.isAnonymous ? null : data.email?.trim() || null,
        message: data.message?.trim() || null,
      };

      const checkoutData = await fundApi.createFundDonation(payload);
      const nextCheckoutUrl = checkoutData?.checkoutUrl;
      if (!nextCheckoutUrl) {
        throw new Error(t('error_no_checkout_url'));
      }

      setCheckoutUrl(nextCheckoutUrl);
      setIsQrFailed(false);
      setIsCheckoutPopupOpen(true);
      reset();
    } catch (error) {
      setSubmitError(error?.response?.data?.message ?? error?.message ?? t('error_create_donation'));
    } finally {
      setIsSubmitting(false);
      setIsConfirmOpen(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ px: { xs: 2.5, md: 3.2 }, py: { xs: 2.5, md: 3.2 }, mb: 3, maxWidth: 720, mx: "auto" }}>
      <Box component="form" onSubmit={handleSubmit(openConfirm)}>
        <ScrollReveal><Controller
          name="isAnonymous"
          control={control}
          render={({ field }) => (
            <Box
              component="label"
              sx={{
                mb: 2.2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                py: 1.2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: field.value ? "primary.main" : "divider",
                backgroundColor: "background.default",
                cursor: "pointer",
                transition: "all 0.2s ease",
                userSelect: "none",
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 700, color: "text.primary", fontSize: "0.94rem" }}>
                  {t('anonymous_label')}
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.8rem", mt: 0.2 }}>
                  {t('anonymous_desc')}
                </Typography>
              </Box>
              <Switch
                checked={field.value}
                onChange={(e) => {
                  field.onChange(e.target.checked);
                  if (e.target.checked) {
                    setValue("donorName", "");
                    setValue("email", "");
                    setValue("phone", "");
                    setValue("address", "");
                  }
                }}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: "primary.main" },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "primary.main" },
                }}
              />
            </Box>
          )}
        /></ScrollReveal>

        <Grid container spacing={2}>
          <Grid size={12}>
            <ScrollReveal><Controller
              name="amountOption"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field} select fullWidth label={t('amount')}
                  SelectProps={{ MenuProps: { disableScrollLock: true } }}
                  error={Boolean(errors.amountOption)} helperText={errors.amountOption?.message}
                  sx={fieldSx}
                >
                  {DONATION_AMOUNTS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            /></ScrollReveal>
          </Grid>
          {selectedAmountOption === "custom" && (
            <Grid size={12}>
              <ScrollReveal delay={0.05}><Controller
                name="customAmount"
                control={control}
                render={({ field }) => (
                  <MoneyField
                    fullWidth label={t('amount_custom_label')} placeholder={t('amount_custom_placeholder')}
                    value={field.value} onChange={field.onChange} onBlur={field.onBlur}
                    error={Boolean(errors.customAmount)} helperText={errors.customAmount?.message}
                    sx={fieldSx}
                  />
                )}
              /></ScrollReveal>
            </Grid>
          )}

          {!isAnonymous && (
            <>
              <Grid size={12}>
                <ScrollReveal delay={0.08}><Controller
                  name="donorName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field} fullWidth label={t('donor_name_label')}
                      error={Boolean(errors.donorName)} helperText={errors.donorName?.message}
                      sx={fieldSx}
                    />
                  )}
                /></ScrollReveal>
              </Grid>

              <Grid size={12}>
                <ScrollReveal delay={0.12}><Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field} fullWidth label="Email" placeholder={t('field_optional_placeholder', { field: 'Email' })}
                      error={Boolean(errors.email)} helperText={errors.email?.message}
                      sx={fieldSx}
                    />
                  )}
                /></ScrollReveal>
              </Grid>

              <Grid size={12}>
                <ScrollReveal delay={0.16}><Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field} fullWidth label={t('phone_label')} placeholder={t('phone_placeholder')}
                      error={Boolean(errors.phone)} helperText={errors.phone?.message}
                      sx={fieldSx}
                    />
                  )}
                /></ScrollReveal>
              </Grid>

              <Grid size={12}>
                <ScrollReveal delay={0.2}><Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field} fullWidth label={t('address_label')} placeholder={t('address_placeholder')}
                      error={Boolean(errors.address)} helperText={errors.address?.message}
                      sx={fieldSx}
                    />
                  )}
                /></ScrollReveal>
              </Grid>
            </>
          )}

          <Grid size={12}>
            <ScrollReveal delay={0.24}><Controller
              name="message"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field} fullWidth label={t('message_label')} placeholder={t('message_placeholder')} multiline minRows={3}
                  onChange={(event) => field.onChange(event.target.value.slice(0, 100))}
                  error={Boolean(errors.message)} helperText={errors.message?.message || `${field.value?.length || 0}/100 (${t('optional')})`}
                  inputProps={{ maxLength: 100 }} sx={fieldSx}
                />
              )}
            /></ScrollReveal>
          </Grid>
        </Grid>

        <ScrollReveal delay={0.32}>
          <Button
            type="submit" fullWidth variant="contained" disabled={isSubmitting}
            sx={{ mt: 2.2, height: 46, textTransform: "none", fontWeight: 700 }}
          >
            {isSubmitting ? t('submit_processing') : t('submit_donate')}
          </Button>
        </ScrollReveal>
        {submitError ? (
          <Typography sx={{ mt: 1, color: "error.main", fontWeight: 600, fontSize: "0.9rem" }}>{submitError}</Typography>
        ) : null}

        <ScrollReveal delay={0.36} sx={{ mt: 2.6 }}>
          <Typography sx={{ color: "warning.main", fontWeight: 800, mb: 1 }}>{t('note_heading')}</Typography>
          <Typography component="div" sx={{ color: "text.secondary", fontSize: "0.92rem", lineHeight: 1.7 }}>
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              <Box component="li">{t('note_qr')}</Box>
              <Box component="li">{t('note_support')}</Box>
            </Box>
          </Typography>
          <Typography sx={{ mt: 1.5, color: "text.secondary", fontSize: "0.92rem", lineHeight: 1.7 }}>
            {t('note_hotline')}
          </Typography>
        </ScrollReveal>
      </Box>
      <ConfirmDialog
        open={isConfirmOpen}
        title={t('confirm_donation_title')}
        confirmText={t('confirm_donation_confirm')}
        cancelText={t('close_fund_cancel')}
        loading={isSubmitting}
        onConfirm={handleConfirmDonation}
        onCancel={() => setIsConfirmOpen(false)}
        message={(
          <Box component="span" sx={{ display: 'block', color: 'text.primary' }}>
            <Box component="span" sx={{ display: 'block', mb: 2 }}>
              {t('confirm_donation_desc')}
            </Box>

            <Box component="span" sx={{ display: 'block', fontWeight: 700, mb: 0.5 }}>
              {t('confirm_donation_contact_heading')}
            </Box>
            <Box component="span" sx={{ display: 'block' }}>
              {t('manager_label')}: <strong>{fundDetail?.managerName || '—'}</strong>
            </Box>
            <Box component="span" sx={{ display: 'block', mb: 2 }}>
              {t('manager_email_label')}: <strong>{fundDetail?.managerEmail || '—'}</strong>
            </Box>

            <Box component="span" sx={{ display: 'block', fontWeight: 700, mb: 0.5 }}>
              {t('confirm_donation_account_heading')}
            </Box>
            <Box component="span" sx={{ display: 'block' }}>
              {t('confirm_donation_bank_label')}: <strong>{getBankLabel(receivingInfo?.bankName)}</strong>
            </Box>
            <Box component="span" sx={{ display: 'block' }}>
              {t('confirm_donation_account_name_label')}: <strong>{receivingInfo?.accountName || '—'}</strong>
            </Box>
            <Box component="span" sx={{ display: 'block' }}>
              {t('confirm_donation_account_number_label')}: <strong>{receivingInfo?.accountNumber || '—'}</strong>
            </Box>
          </Box>
        )}
      />
      <Dialog open={isCheckoutPopupOpen} onClose={() => setIsCheckoutPopupOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ color: "primary.main", fontWeight: 800 }}>{t('checkout_dialog_title')}</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "text.secondary", fontSize: "0.92rem", mb: 1.5 }}>
            {t('checkout_dialog_desc')}
          </Typography>
          {!isQrFailed ? (
            <Box component="img" src={checkoutUrl} alt={t('checkout_qr_alt')} onError={() => setIsQrFailed(true)} sx={{ width: "100%", maxWidth: 280, mx: "auto", display: "block", borderRadius: 2, border: "1px solid", borderColor: "divider" }} />
          ) : (
            <Typography sx={{ color: "error.main", fontWeight: 600, fontSize: "0.9rem" }}>
              {t('checkout_qr_failed')}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "center" }}>
          <Button variant="contained" onClick={() => setIsCheckoutPopupOpen(false)} sx={{ textTransform: "none", fontWeight: 700 }}>
            {t('close_fund_cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

export default function DetailDonationPage() {
  const { t } = useTranslation('donation');
  const { id } = useParams();
  const navigate = useOrgNavigate();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isOrgManager } = useCanContribute();
  const isAdmin = isAuthenticated && isOrgManager;
  const [fundDetail, setFundDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isAuthLoading && isAdmin) {
      navigate(`/donations/${id}`, { replace: true });
    }
  }, [isAuthLoading, isAdmin, id, navigate]);

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
        setErrorMessage(error?.response?.data?.message ?? t('error_load_fund_detail'));
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    fetchFundDetail();
    return () => { ignore = true; };
  }, [id]);

  return (
    <Page title={fundDetail?.name || t('fund_detail')} meta={<meta name="description" content={t('meta_description')} />}>
      <Box sx={{ bgcolor: "background.default", minHeight: "100vh", py: { xs: 4, md: 5 }, pb: { xs: 6, md: 9 } }}>
        <Container maxWidth={false} sx={{ maxWidth: 1140 }}>
          <ScrollReveal sx={{ mb: 3 }}>
            <Breadcrumb items={[{ label: t('title').toUpperCase(), path: "/donations" }, { label: fundDetail?.name || t('fund_detail'), path: `/donations/${id}` }, { label: t('donate_btn') }]} fontSize="0.8rem" />
          </ScrollReveal>

          {!isLoading && errorMessage ? (
            <Card variant="outlined" sx={{ px: { xs: 2.5, md: 4 }, py: 4, mb: 3 }}>
              <Typography sx={{ color: "error.main", fontWeight: 700 }}>{errorMessage}</Typography>
            </Card>
          ) : null}

          {!isLoading && !errorMessage && fundDetail ? (
            <>
              <ScrollReveal><DonationHeaderCard fundDetail={fundDetail} /></ScrollReveal>
              <ScrollReveal delay={0.1}><DonationContributionForm fundDetail={fundDetail} /></ScrollReveal>
            </>
          ) : null}
        </Container>
      </Box>
    </Page>
  );
}
