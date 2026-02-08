import { Outlet } from "react-router";
import { Box, Container } from "@mui/material";
import Header from "../components/Header";
import Footer from "../components/Footer";

const MainLayout = () => {
  return (
      <Container
        maxWidth={false}
        disableGutters
        sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        <Header />
        <Box component="main" sx={{ flex: 1 }}>
          <Outlet />
        </Box>
        <Footer />
      </Container>
  );
};

export default MainLayout;
