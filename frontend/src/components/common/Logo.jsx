import { Box, Typography } from "@mui/material";

const Logo = ({ size = "medium", variant = "text" }) => {
  const sizes = {
    small: { fontSize: "1.5rem", height: 32 },
    medium: { fontSize: "2rem", height: 40 },
    large: { fontSize: "3rem", height: 60 },
  };

  const currentSize = sizes[size] || sizes.medium;

  if (variant === "image") {
    // return (
    //   <Box
    //     component="img"
    //     src="/logo.png"
    //     alt="Logo"
    //     sx={{ height: currentSize.height, width: "auto" }}
    //   />
    // );
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        cursor: "pointer",
      }}
    >
      <Typography
        variant="h4"
        component="div"
        sx={{
          fontWeight: 700,
          fontSize: currentSize.fontSize,
          color: "#1976d2",
        }}
      >
        HCMUS Alumni
      </Typography>
    </Box>
  );
};

export default Logo;