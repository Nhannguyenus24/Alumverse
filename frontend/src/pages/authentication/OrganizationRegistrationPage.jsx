import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSnackbar } from "notistack";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trans, useTranslation } from "react-i18next";
import { z } from "zod";

import {
  Box, Typography, Button, Alert, CircularProgress, TextField,
  MenuItem, Stack, Avatar, Container,
} from "@mui/material";

import Page from "../../components/Page";
import Input from "../../components/Input";
import Iconify from "../../components/Iconify";
import {
  ScrollRevealGroup,
  ScrollRevealItem,
} from "../../components/animations/ScrollReveal";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";
import { useAuth } from "../../hooks/useAuth";
import useAuthStore from "../../stores/authStore";
import { useOrganization } from "../../hooks/useOrganization";
import { fileToBase64 } from "../../utils/imageUtils";
import { refreshSessionAccessToken, syncAuthStoreFromAccessToken } from "../../utils/axios";
import {
  getTrustedVerifiers, joinOrganization,
  requestPeerVerification, createVerificationRequest, userSettingsApi,
} from "../../utils/api";

// ─── Validation schema ────────────────────────────────────────────────────────
const MIN_STUDY_YEARS = 3;

const parseYearInput = (val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  const parsed = Number(val);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const getValidationSchema = (t) => z.object({
  organizationId: z.number().positive("Organization ID must be provided").int(),
  studentCode: z.string().min(1, t("auth:validation_student_code_required")),
  className: z.string().min(1, t("auth:validation_program_required")),
  startYear: z.preprocess(
    parseYearInput,
    z.number({ error: t("auth:validation_start_year_required") })
      .positive(t("auth:validation_must_be_positive")).int(),
  ),
  // Only a graduate has a graduation year; students and drop-outs leave it empty.
  // An untouched / cleared field arrives as undefined, "" or NaN — all mean "no year".
  graduatedYear: z.preprocess(
    parseYearInput,
    z.number({ error: t("auth:validation_graduated_year_required") })
      .positive(t("auth:validation_must_be_positive")).int().optional(),
  ),
  graduationStatus: z.string().min(1, t("auth:validation_graduation_status_required")),
  degreeType: z.string().min(1, t("auth:validation_major_required")),
}).superRefine((data, ctx) => {
  if (data.graduationStatus !== "GRADUATED") return;

  if (!data.graduatedYear) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["graduatedYear"],
      message: t("auth:validation_graduated_year_required"),
    });
    return;
  }
  // A programme runs at least 3 years, so graduation cannot be sooner than that.
  if (data.startYear && data.graduatedYear < data.startYear + MIN_STUDY_YEARS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["graduatedYear"],
      message: t("auth:validation_graduated_year_after_start", { years: MIN_STUDY_YEARS }),
    });
  }
  if (data.graduatedYear > new Date().getFullYear()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["graduatedYear"],
      message: t("auth:validation_graduated_year_future"),
    });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const parseOrganizationOptions = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item ?? "").trim()).filter(Boolean);
    } catch {
      return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
};

const parseToArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return [value];
    }
  }
  return [];
};

const formatVerifierSubtitle = (programData, majorData) => {
  const programs = parseToArray(programData);
  const majors = parseToArray(majorData);
  const pairs = [];
  const maxLength = Math.max(programs.length, majors.length);
  for (let i = 0; i < maxLength; i++) {
    const p = programs[i] || "";
    const m = majors[i] || "";
    if (p || m) pairs.push({ program: p, major: m });
  }
  return pairs;
};

const getVerifierUserId = (verifier) => verifier?.userId ?? verifier?.id ?? verifier?.user_id;

const GRADUATION_STATUS_OPTIONS = [
  { value: "STUDYING", labelKey: "graduation_status_studying" },
  { value: "GRADUATED", labelKey: "graduation_status_graduated" },
  { value: "DROPPED", labelKey: "graduation_status_dropped" },
];

// ─── Verification option card ─────────────────────────────────────────────────
const VerificationOptionCard = ({ icon, title, description, selected, onClick }) => (
  <Box
    onClick={onClick}
    sx={{
      flex: 1,
      display: "flex",
      alignItems: "flex-start",
      gap: 2,
      p: 2.5,
      borderRadius: 2,
      cursor: "pointer",
      border: (theme) => `1.5px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
      bgcolor: selected ? "primary.lighter" : "background.paper",
      transition: "all 0.15s ease-in-out",
      "&:hover": { borderColor: "primary.light", bgcolor: "primary.lighter" },
    }}
  >
    <Avatar
      sx={{
        width: 44, height: 44, flexShrink: 0,
        bgcolor: selected ? "primary.main" : "grey.200",
        transition: "background-color 0.15s",
      }}
    >
      <Iconify icon={icon} width={22} height={22} sx={{ color: selected ? "white" : "text.secondary" }} />
    </Avatar>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2" fontWeight={700} color={selected ? "primary.darker" : "text.primary"}>
          {title}
        </Typography>
        {selected && (
          <Iconify icon="eva:checkmark-circle-2-fill" sx={{ color: "primary.main", flexShrink: 0 }} width={20} height={20} />
        )}
      </Stack>
      <Typography variant="caption" color="textSecondary" sx={{ display: "block", mt: 0.5, lineHeight: 1.6 }}>
        {description}
      </Typography>
    </Box>
  </Box>
);

// ─── Main component ───────────────────────────────────────────────────────────
const OrganizationRegistrationPage = () => {
  const { t } = useTranslation(["auth", "common", "profile"]);
  const navigate = useOrgNavigate();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { verificationLevel } = useAuth();
  const { organization, loading: organizationLoading } = useOrganization();
  const [searchParams] = useSearchParams();

  // Status
  const [loading, setLoading] = useState(false);

  // Proof file
  const [proofFile, setProofFile] = useState(null);

  // Verifiers
  const [trustedVerifiers, setTrustedVerifiers] = useState([]);
  const [trustedVerifiersLoading, setTrustedVerifiersLoading] = useState(false);
  const [selectedVerifierUserIds, setSelectedVerifierUserIds] = useState([]);

  const [showProofPanel, setShowProofPanel] = useState(false);
  const [showVerifierPanel, setShowVerifierPanel] = useState(false);

  // Org ID resolution
  const queryOrgId = searchParams.get("orgId");
  const parsedQueryOrgId = queryOrgId ? parseInt(queryOrgId, 10) : null;
  const organizationId = organization?.id ?? (Number.isInteger(parsedQueryOrgId) ? parsedQueryOrgId : null);

  const myOrganizationMemberQuery = useQuery({
    queryKey: ["user", "me", "organization-member", organizationId],
    queryFn: () => userSettingsApi.getOrganizationMember(organizationId),
    enabled: Boolean(organizationId),
    staleTime: 0,
    retry: false,
  });

  const memberVerificationLevel = Number(myOrganizationMemberQuery.data?.verificationLevel ?? 0);
  const hasFetchedMemberVerificationLevel = myOrganizationMemberQuery.data?.verificationLevel !== undefined
    && myOrganizationMemberQuery.data?.verificationLevel !== null;
  const effectiveVerificationLevel = hasFetchedMemberVerificationLevel
    ? memberVerificationLevel
    : Number(verificationLevel ?? 0);
  const hasSubmittedVerification = effectiveVerificationLevel >= 1;

  const programOptions = useMemo(() => parseOrganizationOptions(organization?.programs), [organization?.programs]);
  const majorOptions = useMemo(() => parseOrganizationOptions(organization?.majors), [organization?.majors]);

  const {
    register, handleSubmit, setValue, watch, formState: { errors },
  } = useForm({
    resolver: zodResolver(getValidationSchema(t)),
    defaultValues: {
      organizationId: organizationId ?? undefined,
      studentCode: "", className: "", startYear: undefined, graduatedYear: undefined, graduationStatus: "", degreeType: "",
    },
  });

  // Graduation year only applies to graduates; clear it whenever another status is picked
  // so a stale year is never submitted.
  const graduationStatus = watch("graduationStatus");
  const isGraduated = graduationStatus === "GRADUATED";

  useEffect(() => {
    if (!isGraduated) {
      setValue("graduatedYear", "", { shouldValidate: false });
    }
  }, [isGraduated, setValue]);

  useEffect(() => {
    if (organizationId) {
      setValue("organizationId", organizationId);
    } else if (!organizationLoading) {
      enqueueSnackbar("Organization ID is required. Please provide a valid organization.", { variant: 'error' });
    }
  }, [organizationId, organizationLoading, setValue, enqueueSnackbar]);

  useEffect(() => {
    let cancelled = false;
    const loadTrustedVerifiers = async () => {
      if (!organizationId) { setTrustedVerifiers([]); return; }
      setTrustedVerifiersLoading(true);
      try {
        const response = await getTrustedVerifiers(organizationId);
        const rawVerifiers = response?.data?.data ?? response?.data ?? [];
        const verifiers = Array.isArray(rawVerifiers) ? rawVerifiers : [];
        if (!cancelled) setTrustedVerifiers(verifiers);
      } catch (err) {
        if (!cancelled) { setTrustedVerifiers([]); console.error("Failed to load trusted verifiers", err); }
      } finally {
        if (!cancelled) setTrustedVerifiersLoading(false); }
    };
    loadTrustedVerifiers();
    return () => { cancelled = true; };
  }, [organizationId]);

  const handleProofFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    const maxSizeBytes = 5 * 1024 * 1024;
    if (!allowedTypes.includes(file.type)) { enqueueSnackbar(t("auth:proof_invalid_type"), { variant: 'error' }); return; }
    if (file.size > maxSizeBytes) { enqueueSnackbar(t("auth:proof_too_large"), { variant: 'error' }); return; }
    setShowProofPanel(true);
    setProofFile(file);
  };

  const toggleVerifier = (userId) => {
    const id = String(userId);
    setSelectedVerifierUserIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  const onSubmit = async (data) => {
    if (!proofFile && selectedVerifierUserIds.length === 0) {
      enqueueSnackbar(t("auth:select_verification_method"), { variant: 'error' });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        organizationId: data.organizationId,
        program: data.className ? [data.className] : null,
        major: data.degreeType ? [data.degreeType] : null,
        graduatedYear: data.graduatedYear ? [data.graduatedYear] : null,
        graduationStatus: data.graduationStatus ? [data.graduationStatus] : null,
        ...(data.studentCode && { studentCode: data.studentCode }),
        ...(data.startYear && { startYear: data.startYear }),
      };

      const response = await joinOrganization(payload);

      if (response?.data) {
        // Send peer verification requests for all selected verifiers
        if (selectedVerifierUserIds.length > 0) {
          await Promise.allSettled(
            selectedVerifierUserIds.map((verifierId) =>
              requestPeerVerification({ organizationId: data.organizationId, verifierUserId: Number(verifierId) }),
            ),
          );
          enqueueSnackbar(t("auth:peer_verification_sent"), {
            variant: "success",
            autoHideDuration: 8000,
            action: (key) => (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  closeSnackbar(key);
                  navigate("/chat");
                }}
              >
                {t("auth:peer_verification_message_cta")}
              </Button>
            ),
          });
        }

        // Upload proof document
        if (proofFile) {
          try {
            const base64File = await fileToBase64(proofFile);
            await createVerificationRequest({
              organizationId: Number(data.organizationId),
              base64File,
              originalFileName: proofFile.name,
              documentType: proofFile.type === "application/pdf" ? "pdf" : "image",
            });
            enqueueSnackbar(t("auth:proof_verification_sent"), { variant: "success" });
          } catch (proofError) {
            console.error("Failed to submit verification request", proofError);
            enqueueSnackbar(t("auth:proof_verification_failed"), { variant: "error" });
            throw proofError;
          }
        }

        await queryClient.invalidateQueries({
          queryKey: ["user", "me", "organization-member", data.organizationId],
        });
        if (selectedVerifierUserIds.length > 0) {
          // The chosen verifier(s) are now peer-verification counterparts server-side
          // (chat auto-accepted) — refetch so useCanAccessChat picks it up without reload.
          await queryClient.invalidateQueries({
            queryKey: ["user", "me", "peer-verification-counterparts", data.organizationId],
          });
        }
        try {
          const refreshedSession = await refreshSessionAccessToken();
          syncAuthStoreFromAccessToken(refreshedSession);
        } catch (refreshError) {
          console.warn("Could not refresh auth session after verification submit", refreshError);
        }

        // Reflect the submitted request immediately (pending = level 1) so the whole app
        // updates without waiting for the next token refresh to carry the new level.
        // Set last (after the refresh above) so it wins, and never downgrade an existing level.
        const currentLevel = Number(useAuthStore.getState().verificationLevel ?? 0);
        useAuthStore.getState().setVerificationLevel(Math.max(1, currentLevel));

        navigate("/");
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to register to organization. Please try again.";
      enqueueSnackbar(errorMessage, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!organizationId && !organizationLoading) {
    return (
      <Page title={t("auth:org_registration_title")} meta={<meta name="description" content={t("auth:org_registration_title")} />}>
        <Box sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 2 }}>
          <Typography variant="h6" color="error">{t("auth:invalid_organization_title")}</Typography>
          <Typography variant="body2" color="textSecondary">{t("auth:invalid_organization_desc")}</Typography>
          <Button variant="contained" onClick={() => navigate("/", { replace: true })}>{t("auth:back_to_login_btn")}</Button>
        </Box>
      </Page>
    );
  }

  if (myOrganizationMemberQuery.isLoading) {
    return (
      <Page title={t("auth:org_registration_title")} meta={<meta name="description" content={t("auth:org_registration_title")} />}>
        <Box sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 2 }}>
          <CircularProgress size={28} />
          <Typography variant="body2" color="textSecondary">{t("auth:checking_verification")}</Typography>
        </Box>
      </Page>
    );
  }

  if (hasSubmittedVerification) {
    const isFullyVerified = effectiveVerificationLevel >= 2;
    return (
      <Page title={t("auth:org_registration_title")} meta={<meta name="description" content={t("auth:org_registration_title")} />}>
        <Container maxWidth="sm" sx={{ py: { xs: 4, sm: 8 } }}>
          <Box
            sx={{
              p: 4,
              borderRadius: 3,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              bgcolor: "background.paper",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Avatar sx={{ width: 64, height: 64, mx: "auto", bgcolor: isFullyVerified ? "success.main" : "primary.main" }}>
              <Iconify icon={isFullyVerified ? "eva:checkmark-circle-2-fill" : "eva:clock-outline"} width={32} height={32} />
            </Avatar>
            <Box>
              <Typography variant="h4" color="primary.main" fontWeight={800}>
                {isFullyVerified ? t("auth:already_verified_title") : t("auth:pending_verification_title")}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1, lineHeight: 1.7 }}>
                {isFullyVerified
                  ? t("auth:already_verified_desc")
                  : t("auth:pending_verification_desc")}
              </Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ pt: 1 }}>
              <Button variant="outlined" fullWidth onClick={() => navigate("/", { replace: true })}>
                {t("auth:go_to_home")}
              </Button>
              <Button variant="contained" fullWidth onClick={() => navigate("/profile", { replace: true })}>
                {t("auth:view_profile")}
              </Button>
            </Stack>
          </Box>
        </Container>
      </Page>
    );
  }

  return (
    <Page title={t("auth:org_registration_title")} meta={<meta name="description" content={t("auth:org_registration_title")} />}>
      <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
        >
          <ScrollRevealGroup stagger={0.08} sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {/* ── Header ── */}
          <ScrollRevealItem>
            <Typography variant="h1" fontWeight={700} color="primary.main" sx={{ mb: 1.5 }}>
              {t("auth:org_registration_heading")}
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 1.5, textAlign: "justify" }}>
              <Trans i18nKey="auth:org_registration_description" />
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ textAlign: "justify" }}>
              <Trans i18nKey="auth:org_registration_submit_hint" />
            </Typography>
          </ScrollRevealItem>

          {/* ── Section 1: Student Information ── */}
          <ScrollRevealItem sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="h6" color="primary.main">
              {t("auth:section_student_info")}
            </Typography>
            <input type="hidden" {...register("organizationId", { valueAsNumber: true })} />
            <Input
              label={t("auth:student_code_label")}
              placeholder={t("auth:student_code_placeholder")}
              error={!!errors.studentCode}
              helperText={errors.studentCode?.message}
              {...register("studentCode")}
            />
          </ScrollRevealItem>

          {/* ── Section 2: Academic Information ── */}
          <ScrollRevealItem sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="h6" color="primary.main">
              {t("auth:section_academic_info")}
            </Typography>

            {programOptions.length > 0 ? (
              <TextField select label={t("auth:program_label")} error={!!errors.className} helperText={errors.className?.message} defaultValue="" {...register("className")}>
                <MenuItem value="">{t("auth:program_select_placeholder")}</MenuItem>
                {programOptions.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
            ) : (
              <Input label={t("auth:program_label")} placeholder={t("auth:program_placeholder")} error={!!errors.className} helperText={errors.className?.message} {...register("className")} />
            )}

            {majorOptions.length > 0 ? (
              <TextField select label={t("auth:major_label")} error={!!errors.degreeType} helperText={errors.degreeType?.message} defaultValue="" {...register("degreeType")}>
                <MenuItem value="">{t("auth:major_select_placeholder")}</MenuItem>
                {majorOptions.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            ) : (
              <Input label={t("auth:major_label")} placeholder={t("auth:major_placeholder")} error={!!errors.degreeType} helperText={errors.degreeType?.message} {...register("degreeType")} />
            )}

            <TextField select label={t("auth:graduation_status_label")} error={!!errors.graduationStatus} helperText={errors.graduationStatus?.message} defaultValue="" {...register("graduationStatus")}>
              <MenuItem value="">{t("auth:graduation_status_placeholder")}</MenuItem>
              {GRADUATION_STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {t(`auth:${option.labelKey}`)}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Input label={t("auth:start_year_label")} type="number" placeholder={t("auth:start_year_placeholder")} error={!!errors.startYear} helperText={errors.startYear?.message} sx={{ flex: 1 }} {...register("startYear", { valueAsNumber: true })} />
              <Input
                label={t("auth:graduated_year_label")}
                type="number"
                placeholder={t("auth:graduated_year_placeholder")}
                disabled={!isGraduated}
                error={!!errors.graduatedYear}
                helperText={errors.graduatedYear?.message
                  || (!isGraduated ? t("auth:graduated_year_disabled_hint") : undefined)}
                sx={{ flex: 1 }}
                {...register("graduatedYear", { valueAsNumber: true })}
              />
            </Stack>
          </ScrollRevealItem>

          {/* ── Section 3: Verification Method ── */}
          <ScrollRevealItem sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography variant="h6" color="primary.main">
                {t("auth:section_verification_method")} <Typography component="span" variant="caption" color="textSecondary">{t("auth:section_verification_optional")}</Typography>
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {t("auth:section_verification_hint")}
              </Typography>
            </Box>

            {/* Option cards row */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <VerificationOptionCard
                icon="eva:cloud-upload-fill"
                title={t("auth:verification_opt_proof_title")}
                description={t("auth:verification_opt_proof_desc")}
                selected={showProofPanel || Boolean(proofFile)}
                onClick={() => setShowProofPanel((value) => !value)}
              />
              <VerificationOptionCard
                icon="eva:people-fill"
                title={t("auth:verification_opt_verifier_title")}
                description={t("auth:verification_opt_verifier_desc")}
                selected={showVerifierPanel || selectedVerifierUserIds.length > 0}
                onClick={() => setShowVerifierPanel((value) => !value)}
              />
            </Stack>

            {/* Option A: Proof upload panel */}
            {showProofPanel && (
              <Box
                sx={{
                  p: 2.5, borderRadius: 2,
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  bgcolor: "background.paper",
                  display: "flex", flexDirection: "column", gap: 1.5,
                }}
              >
                <Button
                  variant="outlined"
                  component="label"
                  disabled={loading}
                  startIcon={<Iconify icon="eva:cloud-upload-fill" />}
                  sx={{ alignSelf: "flex-start" }}
                >
                  {proofFile ? t("auth:proof_change_file") : t("auth:proof_select_file")}
                  <input hidden type="file" accept=".pdf,image/jpeg,image/png" onChange={handleProofFileChange} />
                </Button>
                <Typography variant="caption" color={proofFile ? "success.main" : "textSecondary"}>
                  {proofFile
                    ? `✓ ${t("auth:proof_selected", { name: proofFile.name })}`
                    : t("auth:proof_format_hint")}
                </Typography>
              </Box>
            )}

            {/* Option B: Verifier selection panel */}
            {showVerifierPanel && (
              <Box
                sx={{
                  borderRadius: 2,
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  overflow: "hidden",
                }}
              >
                {trustedVerifiersLoading ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 3 }}>
                    <CircularProgress size={20} />
                    <Typography variant="caption" color="textSecondary">{t("auth:verifiers_loading")}</Typography>
                  </Box>
                ) : trustedVerifiers.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 5, px: 2 }}>
                    <Iconify icon="eva:people-outline" sx={{ fontSize: 40, color: "text.disabled", mb: 1.5 }} />
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>{t("auth:verifiers_empty_title")}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {t("auth:verifiers_empty_desc")}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    {trustedVerifiers.map((verifier, idx) => {
                      const verifierUserId = getVerifierUserId(verifier);
                      const isSelected = selectedVerifierUserIds.includes(String(verifierUserId));
                      const academicPairs = formatVerifierSubtitle(verifier.program, verifier.major);
                      return (
                        <Box
                          key={verifierUserId ?? `${verifier.email || verifier.studentId || "verifier"}-${idx}`}
                          onClick={() => verifierUserId != null && toggleVerifier(verifierUserId)}
                          sx={{
                            display: "flex", alignItems: "center", gap: 2, px: 2.5, py: 2,
                            cursor: "pointer",
                            bgcolor: isSelected ? "primary.lighter" : "background.paper",
                            borderTop: idx !== 0 ? (theme) => `1px solid ${theme.palette.divider}` : "none",
                            transition: "background-color 0.12s",
                            "&:hover": { bgcolor: isSelected ? "primary.lighter" : "action.hover" },
                          }}
                        >
                          <Avatar src={verifier.avatarUrl} alt={verifier.fullName || verifier.studentId} sx={{ width: 40, height: 40, flexShrink: 0 }}>
                            {(verifier.fullName || verifier.studentId || "?").charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" noWrap color={isSelected ? "primary.darker" : "text.primary"}>
                              {verifier.fullName || verifier.studentId}
                            </Typography>
                            {academicPairs.map((pair, i) => (
                              <Typography key={i} variant="caption" color="textSecondary" component="div">
                                {pair.program}{pair.program && pair.major ? " · " : ""}{pair.major}
                              </Typography>
                            ))}
                          </Box>
                          {isSelected && (
                            <Iconify icon="eva:checkmark-circle-2-fill" sx={{ color: "primary.main", flexShrink: 0 }} width={20} height={20} />
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                )}

                {selectedVerifierUserIds.length > 0 && (
                  <Box sx={{ px: 2.5, py: 1.5, bgcolor: "primary.lighter", borderTop: (theme) => `1px solid ${theme.palette.primary.light}` }}>
                    <Typography variant="caption" color="primary.darker">
                      {t("auth:verifiers_selected_count", { count: selectedVerifierUserIds.length })}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </ScrollRevealItem>

          {/* ── Actions ── */}
          <ScrollRevealItem><Stack direction="row" spacing={2} sx={{ pt: 1 }}>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              size="large"
              onClick={() => navigate("/", { replace: true })}
              disabled={loading}
            >
              {t("auth:org_registration_skip_btn")}
            </Button>
            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
              {loading
                ? <><CircularProgress size={20} sx={{ mr: 1 }} />{t("auth:processing")}</>
                : t("auth:register_join")}
            </Button>
          </Stack></ScrollRevealItem>
          </ScrollRevealGroup>
        </Box>
      </Container>
    </Page>
  );
};

export default OrganizationRegistrationPage;
