import { useEffect, useMemo, useState } from "react";
import { Box, Button, Card, Container, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Switch, TextField, Typography, LinearProgress } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import styled from "@emotion/styled";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import Page from "../../components/Page";
import MoneyField from "../../components/MoneyField";
import { VIETNAM_PHONE_REGEX } from "../../utils/regexUtils";
import { fundApi } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";
import Breadcrumb from "../../components/Breadcrumb";

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
  const { t } = useTranslation('donation');
  return (
    <SurfaceCard sx={{ px: { xs: 2.5, md: 4 }, py: { xs: 3.5, md: 4.5 }, mb: 3 }}>
      <Box sx={{ textAlign: "center" }}>
        <CircleLogo src={fundDetail?.logoUrl || LOGO_FALLBACK_URL} alt="HCMUS Alumni logo" />
        <Typography variant="h4" sx={{ mt: 2.2, fontWeight: 800, color: "#122f5a", fontSize: { xs: "1.6rem", md: "2rem" } }}>
          {fundDetail?.name || t('fund_detail')}
        </Typography>
      </Box>
    </SurfaceCard>
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

  const donationSchema = useMemo(() => getDonationSchema(t), [t]);

  const { control, watch, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      amountOption: "", customAmount: "", isAnonymous: false, donorName: "", email: "", phone: "", address: "", message: "",
    },
  });

  const selectedAmountOption = watch("amountOption");
  const isAnonymous = watch("isAnonymous");

  const onSubmit = async (data) => {
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
    }
  };

  return (
    <Card sx={{ borderRadius: 2.5, backgroundColor: "#ffffff", px: { xs: 2.5, md: 3.2 }, py: { xs: 2.5, md: 3.2 }, boxShadow: "0 12px 28px rgba(20, 79, 166, 0.12)", mb: 3, maxWidth: 720, mx: "auto" }}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid size={12}>
            <Controller
              name="amountOption"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field} select fullWidth label={t('amount')}
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
                  <MoneyField
                    fullWidth label={t('amount_custom_label')} placeholder={t('amount_custom_placeholder')}
                    value={field.value} onChange={field.onChange} onBlur={field.onBlur}
                    error={Boolean(errors.customAmount)} helperText={errors.customAmount?.message}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, backgroundColor: "#f7f9fc" } }}
                  />
                )}
              />
            </Grid>
          )}

          {!isAnonymous && (
            <>
              <Grid size={12}>
                <Controller
                  name="donorName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field} fullWidth label={t('donor_name_label')}
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
                      {...field} fullWidth label="Email" placeholder={t('field_optional_placeholder', { field: 'Email' })}
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
                      {...field} fullWidth label={t('phone_label')} placeholder={t('phone_placeholder')}
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
                      {...field} fullWidth label={t('address_label')} placeholder={t('address_placeholder')}
                      error={Boolean(errors.address)} helperText={errors.address?.message}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, backgroundColor: "#f7f9fc" } }}
                    />
                  )}
                />
              </Grid>
            </>
          )}

          <Grid size={12}>
            <Controller
              name="message"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field} fullWidth label={t('message_label')} placeholder={t('message_placeholder')} multiline minRows={3}
                  onChange={(event) => field.onChange(event.target.value.slice(0, 100))}
                  error={Boolean(errors.message)} helperText={errors.message?.message || `${field.value?.length || 0}/100 (${t('optional')})`}
                  inputProps={{ maxLength: 100 }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, backgroundColor: "#f7f9fc" } }}
                />
              )}
            />
          </Grid>
        </Grid>

        <Controller
          name="isAnonymous"
          control={control}
          render={({ field }) => (
            <Box
              component="label"
              sx={{
                mt: 2.2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                py: 1.2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: field.value ? "#93c5fd" : "#c4b5fd",
                backgroundColor: field.value ? "#eff6ff" : "#f5f3ff",
                cursor: "pointer",
                transition: "all 0.2s ease",
                userSelect: "none",
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 700, color: "#0f2f5f", fontSize: "0.94rem" }}>
                  {t('anonymous_label')}
                </Typography>
                <Typography sx={{ color: "#5f78a4", fontSize: "0.8rem", mt: 0.2 }}>
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
                  "& .MuiSwitch-switchBase.Mui-checked": { color: "#0f2f5f" },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#0f2f5f" },
                  "& .MuiSwitch-track": { backgroundColor: "#7c6fd4" },
                }}
              />
            </Box>
          )}
        />

        <Button
          type="submit" fullWidth variant="contained" disabled={isSubmitting}
          sx={{ mt: 2.2, height: 46, borderRadius: 2, textTransform: "none", fontWeight: 700, backgroundColor: "#0f2f5f", boxShadow: "0 6px 14px rgba(15, 47, 95, 0.25)", "&:hover": { backgroundColor: "#0b2448", boxShadow: "0 8px 16px rgba(15, 47, 95, 0.3)" } }}
        >
          {isSubmitting ? t('submit_processing') : t('submit_donate')}
        </Button>
        {submitError ? (
          <Typography sx={{ mt: 1, color: "#9f2f2f", fontWeight: 600, fontSize: "0.9rem" }}>{submitError}</Typography>
        ) : null}

        <Box sx={{ mt: 2.6 }}>
          <Typography sx={{ color: "#df5e2d", fontWeight: 800, mb: 1 }}>{t('note_heading')}</Typography>
          <Typography component="div" sx={{ color: "#4f617e", fontSize: "0.92rem", lineHeight: 1.7 }}>
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              <Box component="li">{t('note_qr')}</Box>
              <Box component="li">{t('note_support')}</Box>
            </Box>
          </Typography>
          <Typography sx={{ mt: 1.5, color: "#3f5477", fontSize: "0.92rem", lineHeight: 1.7 }}>
            {t('note_hotline')}
          </Typography>
        </Box>
      </Box>
      <Dialog open={isCheckoutPopupOpen} onClose={() => setIsCheckoutPopupOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ color: "#123b7a", fontWeight: 800 }}>{t('checkout_dialog_title')}</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#4f617e", fontSize: "0.92rem", mb: 1.5 }}>
            {t('checkout_dialog_desc')}
          </Typography>
          {!isQrFailed ? (
            <Box component="img" src={checkoutUrl} alt={t('checkout_qr_alt')} onError={() => setIsQrFailed(true)} sx={{ width: "100%", maxWidth: 280, mx: "auto", display: "block", borderRadius: 2, border: "1px solid #dce7f8" }} />
          ) : (
            <Typography sx={{ color: "#9f2f2f", fontWeight: 600, fontSize: "0.9rem" }}>
              {t('checkout_qr_failed')}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "center" }}>
          <Button variant="contained" onClick={() => setIsCheckoutPopupOpen(false)} sx={{ textTransform: "none", fontWeight: 700, backgroundColor: "#0f2f5f", "&:hover": { backgroundColor: "#0b2448" } }}>
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
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "ADMIN";
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
      <PageBackground>
        <Container maxWidth={false} sx={{ maxWidth: 1140 }}>
          <Box sx={{ mb: 3 }}>
            <Breadcrumb items={[{ label: t('title').toUpperCase(), path: "/donations" }, { label: fundDetail?.name || t('fund_detail'), path: `/donations/${id}` }, { label: t('donate_btn') }]} fontSize="0.8rem" />
          </Box>

          {!isLoading && errorMessage ? (
            <SurfaceCard sx={{ px: { xs: 2.5, md: 4 }, py: 4, mb: 3 }}>
              <Typography sx={{ color: "#9f2f2f", fontWeight: 700 }}>{errorMessage}</Typography>
            </SurfaceCard>
          ) : null}

          {!isLoading && !errorMessage && fundDetail ? (
            <>
              <DonationHeaderCard fundDetail={fundDetail} />
              <DonationContributionForm fundDetail={fundDetail} />
            </>
          ) : null}
        </Container>
      </PageBackground>
    </Page>
  );
}