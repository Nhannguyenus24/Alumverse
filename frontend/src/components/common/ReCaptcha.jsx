import { Box, Typography } from "@mui/material";
import ReCAPTCHA from "react-google-recaptcha";
import { useRef } from "react";

const ReCaptcha = ({
  siteKey,
  onChange,
  onExpired,
  onError,
  theme = "light",
  size = "normal", // "normal" | "compact" | "invisible"
  onLoad,
}) => {
  const recaptchaRef = useRef(null);

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

  const reset = () => {
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };

  const execute = () => {
    if (recaptchaRef.current && size === "invisible") {
      recaptchaRef.current.execute();
    }
  };

  if (!siteKey) {
    return (
      <Box sx={{ p: 2, textAlign: "center", color: "error.main" }}>
        <Typography variant="body2">
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