import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSnackbar } from "notistack";
import { z } from "zod";

import {
  Box, Typography, Button, Alert, CircularProgress, TextField, 
  MenuItem, Stack, Paper, Avatar, List, ListItem, ListItemAvatar, 
  ListItemText, Divider, Container
} from "@mui/material";

import Page from "../../components/Page";
import Input from "../../components/Input";
import ConfirmDialog from "../../components/ConfirmDialog";
import Iconify from "../../components/Iconify";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";
import { useOrganization } from "../../hooks/useOrganization";
import { fileToBase64 } from "../../utils/imageUtils";
import {
  getTrustedVerifiers, joinOrganization,
  requestPeerVerification, createVerificationRequest,
} from "../../utils/api";

/**
 * Validation schema for organization registration
 */
const getValidationSchema = (isAllOptional, isAcademicOptional) => z.object({
  organizationId: z.number().positive("Organization ID must be provided").int(),
  studentCode: isAllOptional ? z.string().optional().or(z.literal("")) : z.string().min(1, "Mã số sinh viên là bắt buộc"),
  className: isAcademicOptional ? z.string().optional().or(z.literal("")) : z.string().min(1, "Hệ đào tạo là bắt buộc"),
  startYear: isAcademicOptional
    ? z.preprocess((val) => (val === "" || Number.isNaN(val) ? undefined : Number(val)), z.number().positive("Phải là số dương").int().optional())
    : z.preprocess((val) => (val === "" || Number.isNaN(val) ? undefined : Number(val)), z.number({ required_error: "Năm bắt đầu là bắt buộc", invalid_type_error: "Năm bắt đầu là bắt buộc" }).positive("Phải là số dương").int()),
  graduatedYear: isAcademicOptional
    ? z.preprocess((val) => (val === "" || Number.isNaN(val) ? undefined : Number(val)), z.number().positive("Phải là số dương").int().optional())
    : z.preprocess((val) => (val === "" || Number.isNaN(val) ? undefined : Number(val)), z.number({ required_error: "Năm tốt nghiệp là bắt buộc", invalid_type_error: "Năm tốt nghiệp là bắt buộc" }).positive("Phải là số dương").int()),
  degreeType: isAcademicOptional ? z.string().optional().or(z.literal("")) : z.string().min(1, "Chuyên ngành là bắt buộc"),
});

/**
 * Organization Registration Page
 * Allows users to register/join an organization with academic information
 */
const OrganizationRegistrationPage = () => {
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { organization, loading: organizationLoading } = useOrganization();
  const [searchParams] = useSearchParams();
  
  // Status States
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  
  // Verifier States
  const [trustedVerifiers, setTrustedVerifiers] = useState([]);
  const [trustedVerifiersLoading, setTrustedVerifiersLoading] = useState(false);
  const [selectedVerifierUserId, setSelectedVerifierUserId] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingVerifier, setPendingVerifier] = useState(null);

  const isAllOptional = !!selectedVerifierUserId;
  const isAcademicOptional = !!proofFile || !!selectedVerifierUserId;

  const schema = useMemo(() => getValidationSchema(isAllOptional, isAcademicOptional), [isAllOptional, isAcademicOptional]);
  const resolver = useMemo(() => zodResolver(schema), [schema]);

  // Prefer organization ID from context (resolved by slug), keep query param as fallback.
  const queryOrgId = searchParams.get("orgId");
  const parsedQueryOrgId = queryOrgId ? parseInt(queryOrgId, 10) : null;
  const organizationId = organization?.id ?? (Number.isInteger(parsedQueryOrgId) ? parsedQueryOrgId : null);

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

  const programOptions = useMemo(() => parseOrganizationOptions(organization?.programs), [organization?.programs]);
  const majorOptions = useMemo(() => parseOrganizationOptions(organization?.majors), [organization?.majors]);

  const {
    register, handleSubmit, setValue, getValues, clearErrors, formState: { errors },
  } = useForm({
    resolver,
    defaultValues: {
      organizationId: organizationId ?? undefined,
      studentCode: "", className: "", startYear: undefined, graduatedYear: undefined, degreeType: "",
    },
  });

const formatVerifierSubtitle = (programData, majorData) => {
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

    const programs = parseToArray(programData);
    const majors = parseToArray(majorData);

    const pairs = [];
    const maxLength = Math.max(programs.length, majors.length);

    for (let i = 0; i < maxLength; i++) {
      const p = programs[i] || "";
      const m = majors[i] || "";
      
      // Chỉ thêm vào mảng nếu có ít nhất một trong hai thông tin
      if (p || m) {
        pairs.push({ program: p, major: m });
      }
    }

    return pairs; // Trả về mảng các object thay vì string nối liền
  };

  useEffect(() => {
    clearErrors();
  }, [isAllOptional, isAcademicOptional, clearErrors]);

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
      if (!organizationId) {
        setTrustedVerifiers([]);
        setSelectedVerifierUserId("");
        return;
      }
      setTrustedVerifiersLoading(true);
      try {
        const response = await getTrustedVerifiers(organizationId);
        const verifiers = Array.isArray(response?.data?.data) ? response.data.data : [];
        if (!cancelled) setTrustedVerifiers(verifiers);
      } catch (err) {
        if (!cancelled) {
          setTrustedVerifiers([]);
          console.error("Failed to load trusted verifiers", err);
        }
      } finally {
        if (!cancelled) setTrustedVerifiersLoading(false);
      }
    };

    loadTrustedVerifiers();
    return () => { cancelled = true; };
  }, [organizationId]);

  const handleProofFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      setError("Chỉ hỗ trợ file PDF, JPG hoặc PNG cho minh chứng.");
      return;
    }
    if (file.size > maxSizeBytes) {
      setError("File minh chứng vượt quá 5MB. Vui lòng chọn file nhỏ hơn.");
      return;
    }

    setError(null);
    setProofFile(file);
  };

  const onSubmit = async (data, verifierIdOverride) => {
    setError(null);
    setLoading(true);

    const verifierId = typeof verifierIdOverride === "string" || typeof verifierIdOverride === "number"
        ? verifierIdOverride
        : selectedVerifierUserId;

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
        if (verifierId) {
          try {
            await requestPeerVerification({ organizationId: data.organizationId, verifierUserId: Number(verifierId) });
            enqueueSnackbar("Yêu cầu xác thực đồng nghiệp đã được gửi.", { variant: "success" });
          } catch (peerError) {
            console.error("Failed to request peer verification", peerError);
            enqueueSnackbar("Gửi yêu cầu xác thực thất bại, nhưng đăng ký tổ chức đã thành công.", { variant: "warning" });
          }
        }

        if (proofFile) {
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
      setConfirmOpen(false);
    }
  };

  const handleVerifierClick = (verifier) => {
    setSelectedVerifierUserId(String(verifier.userId));
    setPendingVerifier(verifier);
    setConfirmOpen(true);
  };

  const handleConfirmVerification = () => {
    if (pendingVerifier) {
      const currentData = getValues();
      onSubmit(currentData, String(pendingVerifier.userId));
    }
  };

  if (!organizationId && !organizationLoading) {
    return (
      <Page title="Organization Registration" meta={<meta name="description" content="Register to organization" />}>
        <Box sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 2 }}>
          <Typography variant="h6" color="error">Invalid Organization</Typography>
          <Typography variant="body2" color="textSecondary">Please provide a valid organization to register.</Typography>
          <Button variant="contained" onClick={() => navigate("/auth/login", { replace: true })}>Back to Login</Button>
        </Box>
      </Page>
    );
  }

  return (
    <Page title="Organization Registration" meta={<meta name="description" content="Register to organization" />}>
      <Container maxWidth="xl" sx={{ pt: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, lg: 6 }, pb: { xs: 2, sm: 3, md: 4 } }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={4} sx={{ maxWidth: "1200px", margin: "0 auto", p: { xs: 2, sm: 3 } }}>
          
          {/* Left Section: Form */}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ flex: 1, display: "flex", flexDirection: "column", gap: { xs: 1.5, sm: 2 } }}>
            <Typography variant="h1" fontWeight={700} color="primary.main" sx={{ mb: 1 }}>ĐĂNG KÝ TỔ CHỨC</Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>Vui lòng cung cấp thông tin học thuật của bạn để đăng ký tham gia tổ chức.</Typography>

            {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
            {isAllOptional && <Alert severity="info" sx={{ mb: 2 }}>Bạn đã chọn người xác thực, không cần điền các thông tin bên dưới.</Alert>}

            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={600} color={!isAllOptional ? "primary.main" : "textSecondary"}>
                Thông tin sinh viên {!isAllOptional ? "(Bắt buộc)" : "(Tùy chọn)"}
              </Typography>
            </Box>

            <input type="hidden" { ...register("organizationId", { valueAsNumber: true }) } />
            <Input label="Mã số sinh viên" placeholder="Ví dụ: 1234567" error={!!errors.studentCode} helperText={errors.studentCode?.message} { ...register("studentCode") } />

            <Box sx={{ mb: 1, mt: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} color={!isAcademicOptional ? "primary.main" : "textSecondary"}>
                Thông tin học thuật {!isAcademicOptional ? "(Bắt buộc)" : "(Tùy chọn)"}
              </Typography>
            </Box>

            {programOptions.length > 0 ? (
              <TextField select label="Hệ đào tạo" error={!!errors.className} helperText={errors.className?.message} defaultValue="" { ...register("className") }>
                <MenuItem value="">Chọn hệ đào tạo</MenuItem>
                {programOptions.map((program) => <MenuItem key={program} value={program}>{program}</MenuItem>)}
              </TextField>
            ) : (
              <Input label="Hệ đào tạo" placeholder="Ví dụ: K15" error={!!errors.className} helperText={errors.className?.message} { ...register("className") } />
            )}

            <Stack direction="row" spacing={2}>
              <Input label="Năm bắt đầu" type="number" placeholder="Ví dụ: 2015" error={!!errors.startYear} helperText={errors.startYear?.message} sx={{ flex: 1 }} { ...register("startYear", { valueAsNumber: true }) } />
              <Input label="Năm tốt nghiệp" type="number" placeholder="Ví dụ: 2019" error={!!errors.graduatedYear} helperText={errors.graduatedYear?.message} sx={{ flex: 1 }} { ...register("graduatedYear", { valueAsNumber: true }) } />
            </Stack>

            {majorOptions.length > 0 ? (
              <TextField select label="Chuyên ngành" error={!!errors.degreeType} helperText={errors.degreeType?.message} defaultValue="" { ...register("degreeType") }>
                <MenuItem value="">Chọn chuyên ngành</MenuItem>
                {majorOptions.map((major) => <MenuItem key={major} value={major}>{major}</MenuItem>)}
              </TextField>
            ) : (
              <Input label="Chuyên ngành" placeholder="Ví dụ: Khoa học máy tính" error={!!errors.degreeType} helperText={errors.degreeType?.message} { ...register("degreeType") } />
            )}

            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle1" fontWeight={600} color="textSecondary" sx={{ mb: 2 }}>Minh chứng (Tùy chọn)</Typography>
              <Button variant="outlined" component="label" fullWidth disabled={loading} startIcon={<Iconify icon="eva:cloud-upload-fill" />}>
                {proofFile ? "Đổi file minh chứng" : "Tải lên minh chứng"}
                <input hidden type="file" accept=".pdf,image/jpeg,image/png" onChange={handleProofFileChange} />
              </Button>
              <Typography variant="caption" color="textSecondary" sx={{ display: "block", mt: 1 }}>
                {proofFile ? `Đã chọn: ${proofFile.name}` : "Hỗ trợ PDF/JPG/PNG, tối đa 2MB."}
              </Typography>
            </Box>

            <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
              <Button variant="outlined" color="secondary" fullWidth size="large" onClick={() => navigate("/auth/login", { replace: true })} disabled={loading}>Hủy bỏ</Button>
              <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
                {loading ? <><CircularProgress size={20} sx={{ mr: 1 }} /> Đang xử lý...</> : "Đăng ký tham gia"}
              </Button>
            </Box>
          </Box>

          {/* Right Section: Trusted Verifiers */}
          <Box sx={{ width: { xs: "100%", md: "400px" }, flexShrink: 0 }}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}`, overflow: "hidden", bgcolor: "background.paper" }}>
              {/* Header */}
              <Box sx={{ p: 3, background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.lighter} 0%, ${theme.palette.background.paper} 100%)`, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40 }}><Iconify icon="eva:shield-fill" width={22} height={22} /></Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={700} color="primary.darker">Người xác thực tin cậy</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>Chọn một người bạn quen biết trong tổ chức để xác thực danh tính, giúp yêu cầu của bạn được phê duyệt nhanh hơn.</Typography>
                  </Box>
                </Stack>
              </Box>

              {/* Content */}
              <Box sx={{ p: 2 }}>
                {trustedVerifiersLoading ? (
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8, gap: 2 }}>
                    <CircularProgress size={32} />
                    <Typography variant="caption" color="textSecondary">Đang tải danh sách...</Typography>
                  </Box>
                ) : (
                  <Stack spacing={1.25}>
                    {/* No verifier option */}
                    <Box
                      onClick={() => setSelectedVerifierUserId("")}
                      sx={{
                        display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: 2, cursor: "pointer", transition: "all 0.15s ease-in-out",
                        border: (theme) => `1.5px solid ${selectedVerifierUserId === "" ? theme.palette.primary.main : theme.palette.divider}`,
                        bgcolor: selectedVerifierUserId === "" ? "primary.lighter" : "transparent",
                        "&:hover": { borderColor: "primary.light", bgcolor: "primary.lighter" },
                      }}
                    >
                      <Avatar sx={{ bgcolor: "grey.200", width: 40, height: 40 }}><Iconify icon="eva:person-done-outline" sx={{ color: "text.secondary" }} /></Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap>Không chọn người xác thực</Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ lineHeight: 1.7, display: "block" }}>Quản trị viên sẽ trực tiếp phê duyệt yêu cầu của bạn.</Typography>
                      </Box>
                      {selectedVerifierUserId === "" && <Iconify icon="eva:checkmark-circle-2-fill" sx={{ color: "primary.main", ml: "auto", flexShrink: 0 }} width={20} height={20} />}
                    </Box>

                    {trustedVerifiers.length > 0 ? (
                      trustedVerifiers.map((verifier) => {
                        const isSelected = String(verifier.userId) === selectedVerifierUserId;
                        // Giờ đây academicPairs sẽ là một mảng các object [{program, major}, ...]
                        const academicPairs = formatVerifierSubtitle(verifier.program, verifier.major);

                        return (
                          <Box
                            key={verifier.userId}
                            onClick={() => handleVerifierClick(verifier)}
                            sx={{
                              display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: 2, cursor: "pointer", transition: "all 0.15s ease-in-out",
                              border: (theme) => `1.5px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
                              bgcolor: isSelected ? "primary.lighter" : "transparent",
                              "&:hover": { borderColor: "primary.light", bgcolor: "primary.lighter" },
                            }}
                          >
                            <Avatar src={verifier.avatarUrl} alt={verifier.fullName || verifier.userName} sx={{ width: 40, height: 40 }}>
                              {(verifier.fullName || verifier.userName || "?").charAt(0).toUpperCase()}
                            </Avatar>
                            
                            {/* Phần hiển thị Tên và các Dòng ngành học */}
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography variant="subtitle2" noWrap color={isSelected ? "primary.darker" : "text.primary"}>
                                {verifier.fullName || verifier.userName}
                              </Typography>
                              
                              {/* Lặp qua từng cặp ngành học để hiển thị theo từng dòng */}
                              {academicPairs.map((pair, index) => (
                                <Typography key={index} variant="caption" color="textSecondary" nowrap
                                  component="div" // Ép kiểu thành khối div để tự động xuống dòng
                                >
                                  {pair.program}{pair.program && pair.major ? " · " : ""}{pair.major}
                                </Typography>
                              ))}
                            </Box>
                            
                            {isSelected && <Iconify icon="eva:checkmark-circle-2-fill" sx={{ color: "primary.main", ml: "auto", flexShrink: 0 }} width={20} height={20} />}
                          </Box>
                        );
                      })
                    ) : (
                      <Box sx={{ textAlign: "center", py: 6, px: 2, borderRadius: 2, bgcolor: "grey.50", border: (theme) => `1px dashed ${theme.palette.divider}` }}>
                        <Iconify icon="eva:people-outline" sx={{ fontSize: 40, color: "text.disabled", mb: 1.5 }} />
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>Chưa có người xác thực</Typography>
                        <Typography variant="caption" color="textSecondary">Hiện chưa có người xác thực khả dụng cho tổ chức này.</Typography>
                      </Box>
                    )}
                  </Stack>
                )}

                {selectedVerifierUserId && (
                  <Alert severity="success" variant="outlined" icon={<Iconify icon="eva:info-fill" />} sx={{ mt: 2, borderRadius: 2 }}>
                    Bạn đã chọn <Box component="span" fontWeight={700}>{trustedVerifiers.find((v) => String(v.userId) === selectedVerifierUserId)?.fullName || "người xác thực"}</Box>. Yêu cầu sẽ được gửi đi sau khi bạn đăng ký.
                  </Alert>
                )}
              </Box>
            </Paper>
          </Box>
        </Stack>

        <ConfirmDialog
          open={confirmOpen}
          title="Xác nhận người xác thực"
          message={`Bạn có chắc chắn muốn chọn ${pendingVerifier?.fullName || "người này"} làm người xác thực cho bạn? Sau khi xác nhận, yêu cầu đăng ký của bạn sẽ được gửi đi ngay lập tức.`}
          confirmText="Xác nhận & Gửi"
          cancelText="Hủy bỏ"
          onConfirm={handleConfirmVerification}
          onCancel={() => setConfirmOpen(false)}
          loading={loading}
        />
      </Container>
    </Page>
  );
};

export default OrganizationRegistrationPage;