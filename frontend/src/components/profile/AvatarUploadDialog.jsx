// components/profile/AvatarUploadDialog.jsx

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Slider,
} from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import Cropper from "react-easy-crop";
import { useTranslation } from "react-i18next";

export default function AvatarUploadDialog({
  open,
  onClose,
  avatarPreview,
  crop,
  zoom,
  setCrop,
  setZoom,
  onCropComplete,
  onFileChange,
  onSave,
}) {
  const { t } = useTranslation(['profile', 'common']);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('profile:update_avatar')}</DialogTitle>

      <DialogContent>
        <Button
          variant="outlined"
          component="label"
          fullWidth
          startIcon={<CameraAltIcon />}
        >
          {t('profile:select_image')}

          <input
            hidden
            type="file"
            accept="image/*"
            onChange={onFileChange}
          />
        </Button>

        {avatarPreview && (
          <>
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: 400,
                mt: 2,
              }}
            >
              <Cropper
                image={avatarPreview}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </Box>

            <Slider
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(_, value) => setZoom(value)}
              sx={{ mt: 2 }}
            />

            <DialogActions>
              <Button onClick={onClose}>{t('common:cancel')}</Button>
              <Button variant="contained" onClick={onSave}>
                {t('profile:save_image')}
              </Button>
            </DialogActions>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}