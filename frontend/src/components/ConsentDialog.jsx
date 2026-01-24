import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Checkbox,
  FormControlLabel,
  Box,
  Typography,
} from "@mui/material";
import { useState } from "react";

const ConsentDialog = ({
  open = false,
  title = "Privacy Policy and Cookie",
  message = "We use cookies to improve your experience. By continuing to use this website, you agree to our use of cookies.",
  onAccept,
  onDecline,
  required = false,
}) => {
  const [consented, setConsented] = useState(false);

  const handleAccept = () => {
    if (onAccept) {
      onAccept();
    }
  };

  const handleDecline = () => {
    if (onDecline) {
      onDecline();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={required ? undefined : handleDecline}
      aria-labelledby="consent-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="consent-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText component="div">
          <Typography variant="body1" paragraph>
            {message}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={consented}
                  onChange={(e) => setConsented(e.target.checked)}
                />
              }
              label="I have read and agree to the privacy policy"
            />
          </Box>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        {!required && (
          <Button onClick={handleDecline} color="inherit">
            Decline
          </Button>
        )}
        <Button
          onClick={handleAccept}
          variant="contained"
          color="primary"
          disabled={required && !consented}
        >
          Accept
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConsentDialog;
