import { Box, CircularProgress, Typography } from "@mui/material";

const LoadingScreen = ({ message = "Loading..." }) => {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "background.default",
        zIndex: 9999,
      }}
    >
      <CircularProgress size={60} thickness={4} />
      {message && (
        <Typography
          variant="body1"
          sx={{ mt: 3, color: "text.secondary" }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingScreen;
