import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSnackbar } from "notistack";
import { z } from "zod";

import {
  Box, Typography, Button, Alert, CircularProgress, TextField,
  MenuItem, Stack, Avatar, Container,
} from "@mui/material";

import Page from "../../components/Page";
import Input from "../../components/Input";
import Iconify from "../../components/Iconify";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";
import { useOrganization } from "../../hooks/useOrganization";
import { fileToBase64 } from "../../utils/imageUtils";
import {
  getTrustedVerifiers, joinOrganization,
  requestPeerVerification, createVerificationRequest,
} from "../../utils/api";

// ─── Validation schema ────────────────────────────────────────────────────────
const validationSchema = z.object({
  organizationId: z.number().positive("Organization ID must be provided").int(),
  studentCode: z.string().min(1, "Mã số sinh viên là bắt buộc"),
  className: z.string().min(1, "Hệ đào tạo là bắt buộc"),
  startYear: z.preprocess(
    (val) => (val === "" || Number.isNaN(val) ? undefined : Number(val)),
    z.number({ required_error: "Năm bắt đầu là bắt buộc", invalid_type_error: "Năm bắt đầu là bắt buộc" })
      .positive("Phải là số dương").int(),
  ),
  graduatedYear: z.preprocess(
    (val) => (val === "" || Number.isNaN(val) ? undefined : Number(val)),
    z.number({ required_error: "Năm tốt nghiệp là bắt buộc", invalid_type_error: "Năm tốt nghiệp là bắt buộc" })
      .positive("Phải là số dương").int(),
  ),
  degreeType: z.string().min(1, "Chuyên ngành là bắt buộc"),
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
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { organization, loading: organizationLoading } = useOrganization();
  const [searchParams] = useSearchParams();

  // Status
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Proof file
  const [proofFile, setProofFile] = useState(null);

  // Verifiers
  const [trustedVerifiers, setTrustedVerifiers] = useState([]);
  const [trustedVerifiersLoading, setTrustedVerifiersLoading] = useState(false);
  const [selectedVerifierUserIds, setSelectedVerifierUserIds] = useState([]);

  // Which verification option is expanded: null | "proof" | "verifier"
  const [verificationOption, setVerificationOption] = useState(null);

  // Org ID resolution
  const queryOrgId = searchParams.get("orgId");
  const parsedQueryOrgId = queryOrgId ? parseInt(queryOrgId, 10) : null;
  const organizationId = organization?.id ?? (Number.isInteger(parsedQueryOrgId) ? parsedQueryOrgId : null);

  const programOptions = useMemo(() => parseOrganizationOptions(organization?.programs), [organization?.programs]);
  const majorOptions = useMemo(() => parseOrganizationOptions(organization?.majors), [organization?.majors]);

  const {
    register, handleSubmit, setValue, formState: { errors },
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      organizationId: organizationId ?? undefined,
      studentCode: "", className: "", startYear: undefined, graduatedYear: undefined, degreeType: "",
    },
  });

  useEffect(() => {
    if (organizationId) {
      setValue("organizationId", organizationId);
      setError(null);
    } else if (!organizationLoading) {
      setError("Organization ID is required. Please provide a valid organization.");
    }
  }, [organizationId, organizationLoading, setValue]);

  useEffect(() => {
    let cancelled = false;
    const loadTrustedVerifiers = async () => {
      if (!organizationId) { setTrustedVerifiers([]); return; }
      setTrustedVerifiersLoading(true);
      try {
        const response = await getTrustedVerifiers(organizationId);
        const verifiers = Array.isArray(response?.data?.data) ? response.data.data : [];
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
    if (!allowedTypes.includes(file.type)) { setError("Chỉ hỗ trợ file PDF, JPG hoặc PNG cho minh chứng."); return; }
    if (file.size > maxSizeBytes) { setError("File minh chứng vượt quá 5MB. Vui lòng chọn file nhỏ hơn."); return; }
    setError(null);
    setProofFile(file);
  };

  const toggleVerifier = (userId) => {
    const id = String(userId);
    setSelectedVerifierUserIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  const handleOptionSelect = (option) => {
    setVerificationOption(option);
    if (option === "proof") setSelectedVerifierUserIds([]);
    if (option === "verifier") setProofFile(null);
  };

  const onSubmit = async (data) => {
    setError(null);
    if (!verificationOption) { setError("Vui lòng chọn một phương thức xác thực."); return; }
    if (verificationOption === "proof" && !proofFile) { setError("Vui lòng tải lên minh chứng."); return; }
    if ( verificationOption === "verifier" && selectedVerifierUserIds.length === 0) {
      setError("Vui lòng chọn ít nhất một người xác thực."); return; }
    setLoading(true);
    try {
      const payload = {
        organizationId: data.organizationId,
        program: data.className ? [data.className] : null,
        major: data.degreeType ? [data.degreeType] : null,
        graduatedYear: data.graduatedYear ? [data.graduatedYear] : null,
        ...(data.studentCode && { studentCode: data.studentCode }),
        ...(data.startYear && { startYear: data.startYear }),
      };

      const response = await joinOrganization(payload);

      if (response?.data) {
        // Send peer verification requests for all selected verifiers
        if (verificationOption === "verifier" && selectedVerifierUserIds.length > 0) {
          await Promise.allSettled(
            selectedVerifierUserIds.map((verifierId) =>
              requestPeerVerification({ organizationId: data.organizationId, verifierUserId: Number(verifierId) }),
            ),
          );
          enqueueSnackbar("Yêu cầu xác thực đồng nghiệp đã được gửi.", { variant: "success" });
        }

        // Upload proof document
        if (verificationOption === "proof" && proofFile) {
          try {
            const base64File = await fileToBase64(proofFile);
            await createVerificationRequest({
              base64File,
              originalFileName: proofFile.name,
              documentType: proofFile.type === "application/pdf" ? "pdf" : "image",
            });
            enqueueSnackbar("Yêu cầu xác thực minh chứng đã được gửi.", { variant: "success" });
          } catch (proofError) {
            console.error("Failed to submit verification request", proofError);
            enqueueSnackbar("Gửi yêu cầu xác thực minh chứng thất bại.", { variant: "error" });
          }
        }

        navigate("/");
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to register to organization. Please try again.";
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!organizationId && !organizationLoading) {
    return (
      <Page title="Organization Registration" meta={<meta name="description" content="Register to organization" />}>
        <Box sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 2 }}>
          <Typography variant="h6" color="error">Invalid Organization</Typography>
          <Typography variant="body2" color="textSecondary">Please provide a valid organization to register.</Typography>
          <Button variant="contained" onClick={() => navigate("/", { replace: true })}>Back to Login</Button>
        </Box>
      </Page>
    );
  }

  return (
    <Page title="Organization Registration" meta={<meta name="description" content="Register to organization" />}>
      <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: "flex", flexDirection: "column", gap: 4 }}
        >
          {/* ── Header ── */}
          <Box>
            <Typography variant="h1" fontWeight={700} color="primary.main" sx={{ mb: 1.5 }}>
              XÁC MINH HỌC VẤN
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Điền thông tin sinh viên và học vấn của bạn, sau đó chọn phương thức xác thực phù hợp. <br></br>
              Yêu cầu xác minh học vấn sẽ được gửi đi khi bạn bấm <strong>Đăng ký tham gia</strong>.
            </Typography>
          </Box>

          {/* ── Section 1: Thông tin sinh viên ── */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="h6" color="primary.main">
              Thông tin sinh viên
            </Typography>
            <input type="hidden" {...register("organizationId", { valueAsNumber: true })} />
            <Input
              label="Mã số sinh viên"
              placeholder="Ví dụ: 1234567"
              error={!!errors.studentCode}
              helperText={errors.studentCode?.message}
              {...register("studentCode")}
            />
          </Box>

          {/* ── Section 2: Thông tin học vấn ── */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="h6" color="primary.main">
              Thông tin học vấn
            </Typography>

            {programOptions.length > 0 ? (
              <TextField select label="Hệ đào tạo" error={!!errors.className} helperText={errors.className?.message} defaultValue="" {...register("className")}>
                <MenuItem value="">Chọn hệ đào tạo</MenuItem>
                {programOptions.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
            ) : (
              <Input label="Hệ đào tạo" placeholder="Ví dụ: K15" error={!!errors.className} helperText={errors.className?.message} {...register("className")} />
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Input label="Năm bắt đầu" type="number" placeholder="Ví dụ: 2015" error={!!errors.startYear} helperText={errors.startYear?.message} sx={{ flex: 1 }} {...register("startYear", { valueAsNumber: true })} />
              <Input label="Năm tốt nghiệp" type="number" placeholder="Ví dụ: 2019" error={!!errors.graduatedYear} helperText={errors.graduatedYear?.message} sx={{ flex: 1 }} {...register("graduatedYear", { valueAsNumber: true })} />
            </Stack>

            {majorOptions.length > 0 ? (
              <TextField select label="Chuyên ngành" error={!!errors.degreeType} helperText={errors.degreeType?.message} defaultValue="" {...register("degreeType")}>
                <MenuItem value="">Chọn chuyên ngành</MenuItem>
                {majorOptions.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            ) : (
              <Input label="Chuyên ngành" placeholder="Ví dụ: Khoa học máy tính" error={!!errors.degreeType} helperText={errors.degreeType?.message} {...register("degreeType")} />
            )}
          </Box>

          {/* ── Section 3: Phương thức xác thực ── */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography variant="h6" color="primary.main">
                Phương thức xác thực <Typography component="span" variant="caption" color="textSecondary">(Tùy chọn)</Typography>
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Vui lòng chọn một trong hai phương thức xác thực bên dưới để hoàn tất đăng ký.
              </Typography>
            </Box>

            {/* Option cards row */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <VerificationOptionCard
                icon="eva:cloud-upload-fill"
                title="Tải lên minh chứng"
                description="Đính kèm file ảnh hoặc PDF làm bằng chứng xác nhận thông tin học vấn."
                selected={verificationOption === "proof"}
                onClick={() => handleOptionSelect("proof")}
              />
              <VerificationOptionCard
                icon="eva:people-fill"
                title="Chọn người xác thực"
                description="Nhờ một người quen trong tổ chức xác nhận danh tính thay cho bạn."
                selected={verificationOption === "verifier"}
                onClick={() => handleOptionSelect("verifier")}
              />
            </Stack>

            {/* Option A: Proof upload panel */}
            {verificationOption === "proof" && (
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
                  {proofFile ? "Đổi file minh chứng" : "Chọn file"}
                  <input hidden type="file" accept=".pdf,image/jpeg,image/png" onChange={handleProofFileChange} />
                </Button>
                <Typography variant="caption" color={proofFile ? "success.main" : "textSecondary"}>
                  {proofFile
                    ? `✓ Đã chọn: ${proofFile.name}`
                    : "Hỗ trợ PDF, JPG hoặc PNG — tối đa 5MB."}
                </Typography>
              </Box>
            )}

            {/* Option B: Verifier selection panel */}
            {verificationOption === "verifier" && (
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
                    <Typography variant="caption" color="textSecondary">Đang tải danh sách...</Typography>
                  </Box>
                ) : trustedVerifiers.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 5, px: 2 }}>
                    <Iconify icon="eva:people-outline" sx={{ fontSize: 40, color: "text.disabled", mb: 1.5 }} />
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>Chưa có người xác thực</Typography>
                    <Typography variant="caption" color="textSecondary">
                      Hiện chưa có người xác thực khả dụng cho tổ chức này.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    {trustedVerifiers.map((verifier, idx) => {
                      const isSelected = selectedVerifierUserIds.includes(String(verifier.userId));
                      const academicPairs = formatVerifierSubtitle(verifier.program, verifier.major);
                      return (
                        <Box
                          key={verifier.userId}
                          onClick={() => toggleVerifier(verifier.userId)}
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
                      Đã chọn {selectedVerifierUserIds.length} người xác thực. Yêu cầu sẽ được gửi đến tất cả sau khi đăng ký.
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>

          {/* ── Errors ── */} 
          {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

          {/* ── Actions ── */}
          <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              size="large"
              onClick={() => navigate("/", { replace: true })}
              disabled={loading}
            >
              Hủy bỏ
            </Button>
            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
              {loading
                ? <><CircularProgress size={20} sx={{ mr: 1 }} />Đang xử lý...</>
                : "Đăng ký tham gia"}
            </Button>
          </Stack>
        </Box>
      </Container>
    </Page>
  );
};

export default OrganizationRegistrationPage;