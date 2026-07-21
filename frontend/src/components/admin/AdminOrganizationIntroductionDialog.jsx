import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Box,
  Typography,
  Stack,
  Divider,
  Avatar,
  IconButton,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useSnackbar } from "notistack";
import { IMAGE_ACCEPT, useUploadImage, validateImageFile } from "../../utils/imageUtils";
import WYSIWYG from "../WYSIWYG";
import { prepareRichTextForEdit } from "../../utils/stringUtils";

const AdminOrganizationIntroductionDialog = ({
  open,
  onClose,
  introduction,
  onConfirm,
}) => {
  const { t } = useTranslation(["admin", "common"]);
  const { enqueueSnackbar } = useSnackbar();
  const { uploadFile, isPending } = useUploadImage();

  // Upload a picked image through the image service and return a hosted URL
  // (never base64), reporting validation/upload errors via snackbar.
  const uploadImage = async (file) => {
    const validation = validateImageFile(file, t);
    if (!validation.valid) {
      enqueueSnackbar(validation.message, { variant: "error" });
      return null;
    }
    try {
      const url = await uploadFile(file);
      if (!url) throw new Error("empty_url");
      return url;
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message ?? t("common:image_upload_error"),
        { variant: "error" },
      );
      return null;
    }
  };

  const [formData, setFormData] = useState({
    content: "",
    vision: "",
    mission: "",
    coreValues: "",
    bannerUrl: "",
    images: "",
  });

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      if (introduction) {
        setFormData({
          content: prepareRichTextForEdit(introduction.content || ""),
          vision: introduction.vision || "",
          mission: introduction.mission || "",
          coreValues: introduction.coreValues || "",
          bannerUrl: introduction.bannerUrl || "",
          images: Array.isArray(introduction.imageUrls) ? introduction.imageUrls.join(", ") : "",
        });
      } else {
        setFormData({
          content: "",
          vision: "",
          mission: "",
          coreValues: "",
          bannerUrl: "",
          images: "",
        });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [introduction, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const payload = {
      content: formData.content || "",
      vision: formData.vision || "",
      mission: formData.mission || "",
      coreValues: formData.coreValues || "",
      bannerUrl: formData.bannerUrl?.trim() || null,
      images: formData.images
        ? formData.images.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      leaders: (introduction?.leaders || [])
        .filter((m) => m && typeof m.name === 'string' && m.name.trim() !== '')
        .map((m) => ({
          name: m.name.trim(),
          positions: m.positions || '',
          email: m.email || '',
          image: m.image || '',
          content: m.content || '',
        })),
      teamMembers: (introduction?.teamMembers || [])
        .filter((m) => m && typeof m.name === 'string' && m.name.trim() !== '')
        .map((m) => ({
          name: m.name.trim(),
          positions: m.positions || '',
          email: m.email || '',
          image: m.image || '',
          content: m.content || '',
        })),
      leadersContent: introduction?.leadersContent || "",
      teamMembersContent: introduction?.teamMembersContent || "",
    };
    onConfirm(payload);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle component="div" sx={{ p: 3, pb: 2 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 800, color: "primary.main" }}
        >
          {t("admin:org_intro_dialog_title")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t("admin:org_intro_dialog_subtitle")}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ p: 3, pt: 1 }}>
        <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          {/* General Introduction Section */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
              {t("admin:org_intro_section_general")}
            </Typography>
            <WYSIWYG
              value={formData.content}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, content: val }))
              }
              placeholder={t("admin:org_intro_content_placeholder")}
              height={250}
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
              {t("admin:org_intro_section_banner")}
            </Typography>
            {formData.bannerUrl && (
              <Box
                component="img"
                src={formData.bannerUrl}
                sx={{
                  width: "100%",
                  height: 200,
                  objectFit: "cover",
                  borderRadius: 2,
                  mb: 2,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              />
            )}
            <Button
              component="label"
              variant="outlined"
              size="small"
              startIcon={<CloudUploadIcon />}
              disabled={isPending}
              sx={{ textTransform: 'none', mb: 1 }}
            >
              {t("admin:org_intro_upload_banner")}
              <input
                type="file"
                hidden
                accept={IMAGE_ACCEPT}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  const url = await uploadImage(file);
                  if (url) {
                    setFormData(prev => ({ ...prev, bannerUrl: url }));
                  }
                }}
              />
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {t("admin:org_intro_banner_base64_hint")}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
              {t("admin:org_intro_section_gallery")}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
              {formData.images.split(",").filter(Boolean).map((img, idx) => (
                <Box key={idx} sx={{ position: 'relative' }}>
                  <Avatar 
                    src={img} 
                    variant="rounded" 
                    sx={{ width: 80, height: 80, border: 1, borderColor: 'divider' }} 
                  />
                  <IconButton 
                    size="small" 
                    sx={{ 
                      position: 'absolute', 
                      top: -6, 
                      right: -6, 
                      width: 22, 
                      height: 22, 
                      p: 0, 
                      borderRadius: '50%', 
                      bgcolor: 'error.main', 
                      color: 'common.white', 
                      '&:hover': { bgcolor: 'error.dark' },
                      zIndex: 1,
                    }}
                    onClick={() => {
                      const list = formData.images.split(",").filter(Boolean);
                      list.splice(idx, 1);
                      setFormData(prev => ({ ...prev, images: list.join(",") }));
                    }}
                  >
                    <Box component="span" sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1 }}>×</Box>
                  </IconButton>
                </Box>
              ))}
            </Stack>
            <Button
              component="label"
              variant="outlined"
              size="small"
              startIcon={<CloudUploadIcon />}
              disabled={isPending}
              sx={{ textTransform: 'none' }}
            >
              {t("admin:org_intro_add_to_gallery")}
              <input
                type="file"
                hidden
                multiple
                accept={IMAGE_ACCEPT}
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  e.target.value = "";
                  const urls = (await Promise.all(files.map(uploadImage))).filter(Boolean);
                  if (urls.length === 0) return;
                  setFormData(prev => {
                    const current = prev.images.split(",").filter(Boolean);
                    return { ...prev, images: [...current, ...urls].join(",") };
                  });
                }}
              />
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              {t("admin:org_intro_gallery_min4_hint")}
            </Typography>
          </Box>

          <Divider>
            <Typography variant="caption" color="text.disabled" fontWeight={700}>
              {t("admin:org_intro_core_builder")}
            </Typography>
          </Divider>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, width: '100%' }}>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label={t("admin:org_intro_vision")}
                name="vision"
                value={formData.vision}
                onChange={handleChange}
                multiline
                rows={7}
                placeholder={t("admin:org_intro_vision_placeholder")}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    overflowY: 'auto !important',
                  },
                }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label={t("admin:org_intro_mission")}
                name="mission"
                value={formData.mission}
                onChange={handleChange}
                multiline
                rows={7}
                placeholder={t("admin:org_intro_mission_placeholder")}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    overflowY: 'auto !important',
                  },
                }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label={t("admin:org_intro_core_values")}
                name="coreValues"
                value={formData.coreValues}
                onChange={handleChange}
                multiline
                rows={7}
                placeholder={t("admin:org_intro_core_values_placeholder")}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    overflowY: 'auto !important',
                  },
                }}
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2, bgcolor: "action.hover" }}>
        <Button onClick={onClose} variant="outlined" color="secondary">
          {t("common:cancel")}
        </Button>
        <Button variant="contained" onClick={handleSubmit}>
          {t("admin:org_intro_update_btn")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminOrganizationIntroductionDialog;
