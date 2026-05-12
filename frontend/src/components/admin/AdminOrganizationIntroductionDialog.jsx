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
  Divider,
} from "@mui/material";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

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
  });

  useEffect(() => {
    if (introduction) {
      setFormData({
        content: introduction.content || "",
        vision: introduction.vision || "",
        mission: introduction.mission || "",
        coreValues: introduction.coreValues || "",
        bannerUrl: introduction.bannerUrl || "",
      });
    } else {
      setFormData({
        content: "",
        vision: "",
        mission: "",
        coreValues: "",
        bannerUrl: "",
      });
    }
  }, [introduction, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onConfirm(formData);
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
        <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ mb: 2 }}>
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
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block" }}
            >
              Nội dung chính hiển thị ở phần đầu trang giới thiệu. Bạn có thể
              chèn ảnh trực tiếp vào đây.
            </Typography>
          </Box>
          <TextField
            fullWidth
            label="Banner URL"
            name="bannerUrl"
            value={formData.bannerUrl}
            onChange={handleChange}
            placeholder="https://example.com/banner.jpg"
            helperText="Ảnh nền lớn cho trang giới thiệu."
          />
          <Divider sx={{ my: 0.5 }}>
            <Typography
              variant="caption"
              color="text.disabled"
              fontWeight={700}
            >
              MỤC TIÊU & GIÁ TRỊ
            </Typography>
          </Divider>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              fullWidth
              label="Tầm nhìn"
              name="vision"
              value={formData.vision}
              onChange={handleChange}
              multiline
              rows={3}
              placeholder="Định hướng phát triển dài hạn..."
            />
            <TextField
              fullWidth
              label="Sứ mạng"
              name="mission"
              value={formData.mission}
              onChange={handleChange}
              multiline
              rows={3}
              placeholder="Mục đích cốt lõi và nhiệm vụ của tổ chức..."
            />
            <TextField
              fullWidth
              label="Giá trị cốt lõi"
              name="coreValues"
              value={formData.coreValues}
              onChange={handleChange}
              multiline
              rows={3}
              placeholder="Các nguyên tắc dẫn dắt và triết lý hoạt động..."
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2, bgcolor: "action.hover" }}>
        <Button
          onClick={onClose}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: "text.secondary",
          }}
        >
          Hủy bỏ
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            px: 4,
            borderRadius: 2,
            boxShadow: (theme) => theme.customShadows?.primary,
          }}
        >
          Cập nhật nội dung
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminOrganizationIntroductionDialog;
