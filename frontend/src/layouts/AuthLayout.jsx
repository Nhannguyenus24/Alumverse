import { Outlet } from "react-router";
import { Box, Container } from "@mui/material";
import Logo from "../components/Logo";

const AuthLayout = () => {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
        }}
      >
        <Logo sx={{ mb: 4 }} />
        <Outlet />
      </Box>
    </Container>
  );
};

export default AuthLayout;