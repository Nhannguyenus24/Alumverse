import { Link } from "react-router";
import { Box, Typography, Button } from "@mui/material";

const NotFoundPage = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: 2,
      }}
    >
      <Typography variant="h1">404</Typography>
      <Typography variant="h5">Page Not Found</Typography>
      <Button component={Link} to="/" variant="contained">
        Go Home
      </Button>
    </Box>
  );
};

export default NotFoundPage;