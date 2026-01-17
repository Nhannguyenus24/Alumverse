import { Link } from "react-router";
import { Box, Typography, Button } from "@mui/material";

const UnauthorizedPage = () => {
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
      <Typography variant="h1">403</Typography>
      <Typography variant="h5">Unauthorized Access</Typography>
      <Typography>You don't have permission to access this page.</Typography>
      <Button component={Link} to="/dashboard" variant="contained">
        Go to Dashboard
      </Button>
    </Box>
  );
};

export default UnauthorizedPage;