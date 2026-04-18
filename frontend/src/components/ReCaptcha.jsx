import { Box, Typography } from "@mui/material";
import ReCAPTCHA from "react-google-recaptcha";
import { useEffect, useRef } from "react";
import { useSnackbar } from "notistack";

const ReCaptcha = ({
  siteKey,
  onChange,
  onExpired,
  onError,
  theme = "light",
  size = "normal", // "normal" | "compact" | "invisible"
  onLoad,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const recaptchaRef = useRef(null);
  const missingKeyShownRef = useRef(false);

  useEffect(() => {
    if (!siteKey && !missingKeyShownRef.current) {
      enqueueSnackbar("ReCAPTCHA v2 site key is not configured", { variant: "error" });
      missingKeyShownRef.current = true;
    }
    if (siteKey) {
      missingKeyShownRef.current = false;
    }
  }, [siteKey, enqueueSnackbar]);

  const handleChange = (token) => {
    if (onChange) {
      onChange(token);
    }
  };

  const handleExpired = () => {
    if (onExpired) {
      onExpired();
    }
  };

  const handleError = (error) => {
    if (onError) {
      onError(error);
    }
  };

  const handleLoad = () => {
    if (onLoad) {
      onLoad();
    }
  };

  if (!siteKey) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          ReCAPTCHA v2 site key is not configured
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={siteKey}
        onChange={handleChange}
        onExpired={handleExpired}
        onError={handleError}
        onLoad={handleLoad}
        theme={theme}
        size={size}
      />
    </Box>
  );
};

ReCaptcha.reset = (ref) => {
  if (ref?.current) {
    ref.current.reset();
  }
};

ReCaptcha.execute = (ref) => {
  if (ref?.current) {
    ref.current.execute();
  }
};

export default ReCaptcha;
