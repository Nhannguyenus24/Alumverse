import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

/**
 * Full-screen blocking scrim shown while an admin action is processing, so the
 * UI can't be interacted with (prevents spam-clicks) until it finishes.
 */
const ActionOverlay = ({ open, message }) => {
  const { t } = useTranslation("common");
  return (
    <Backdrop
      open={Boolean(open)}
      sx={{
        color: "#fff",
        zIndex: (theme) => theme.zIndex.modal + 10,
        backgroundColor: "rgba(0,0,0,0.35)",
      }}
    >
      <Stack alignItems="center" spacing={2}>
        <CircularProgress color="inherit" />
        <Typography variant="body2">
          {message || t("processing", "Đang xử lý...")}
        </Typography>
      </Stack>
    </Backdrop>
  );
};

export default ActionOverlay;
