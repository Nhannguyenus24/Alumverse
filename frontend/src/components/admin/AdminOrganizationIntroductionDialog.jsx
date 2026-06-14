import { useEffect, useState } from "react";
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
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import Grid from "@mui/material/Grid";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { fileToBase64 } from "../../utils/imageUtils";

const AdminOrganizationIntroductionDialog = ({
  open,
  onClose,
  introduction,
  onConfirm,
}) => {
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
          content: introduction.content || "",
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
      ...formData,
      images: formData.images.split(",").map(s => s.trim()).filter(Boolean),
      // Keep existing leaders and teamMembers
      leaders: introduction?.leaders || [],
      teamMembers: introduction?.teamMembers || [],
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
      <DialogTitle sx={{ p: 3, pb: 2 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 800, color: "primary.main" }}
        >
          Cập nhật thông tin giới thiệu
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Các thông tin này sẽ được hiển thị công khai trên trang chủ của tổ
          chức.
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ p: 3, pt: 1 }}>
        <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          {/* General Introduction Section */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
              Giới thiệu chung (Rich Text)
            </Typography>
            <Box
              sx={{
                "& .ql-container": {
                  borderBottomLeftRadius: 8,
                  borderBottomRightRadius: 8,
                  minHeight: 200,
                },
                "& .ql-toolbar": {
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                  bgcolor: "action.hover",
                },
              }}
            >
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, content: val }))
                }
                placeholder="Mô tả tóm tắt về lịch sử, quy mô, thành tựu của tổ chức..."
              />
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
              Ảnh bìa tổ chức
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
              sx={{ textTransform: 'none', mb: 1 }}
            >
              Tải ảnh bìa lên
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const base64 = await fileToBase64(file);
                    setFormData(prev => ({ ...prev, bannerUrl: base64 }));
                  }
                }}
              />
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Ảnh bìa sẽ được gửi dưới dạng Base64
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
              Bộ sưu tập ảnh (Gallery)
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
                    sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
                    onClick={() => {
                      const list = formData.images.split(",").filter(Boolean);
                      list.splice(idx, 1);
                      setFormData(prev => ({ ...prev, images: list.join(",") }));
                    }}
                  >
                    <Box sx={{ fontSize: 12 }}>×</Box>
                  </IconButton>
                </Box>
              ))}
            </Stack>
            <Button
              component="label"
              variant="outlined"
              size="small"
              startIcon={<CloudUploadIcon />}
              sx={{ textTransform: 'none' }}
            >
              Thêm ảnh vào bộ sưu tập
              <input
                type="file"
                hidden
                multiple
                accept="image/*"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  const base64s = await Promise.all(files.map(fileToBase64));
                  setFormData(prev => {
                    const current = prev.images.split(",").filter(Boolean);
                    return { ...prev, images: [...current, ...base64s].join(",") };
                  });
                }}
              />
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Bạn có thể chọn nhiều ảnh cùng lúc
            </Typography>
          </Box>

          <Divider>
            <Typography variant="caption" color="text.disabled" fontWeight={700}>
              TẦM NHÌN - SỨ MẠNG - GIÁ TRỊ CỐT LÕI
            </Typography>
          </Divider>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Tầm nhìn"
                name="vision"
                value={formData.vision}
                onChange={handleChange}
                multiline
                rows={4}
                placeholder="Định hướng dài hạn..."
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Sứ mạng"
                name="mission"
                value={formData.mission}
                onChange={handleChange}
                multiline
                rows={4}
                placeholder="Mục đích cốt lõi..."
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Giá trị cốt lõi"
                name="coreValues"
                value={formData.coreValues}
                onChange={handleChange}
                multiline
                rows={4}
                placeholder="Triết lý hoạt động..."
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2, bgcolor: "action.hover" }}>
        <Button onClick={onClose} variant="outlined" color="secondary">
          Hủy
        </Button>
        <Button variant="contained" onClick={handleSubmit}>
          Cập nhật nội dung
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminOrganizationIntroductionDialog;
