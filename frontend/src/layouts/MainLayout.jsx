import { Outlet, useLocation } from "react-router";
import { Box } from "@mui/material";
import Page from "../components/Page";
import Header from "../components/Header";
import Footer from "../components/Footer";

const MainLayout = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <Page>
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Header transparent={isHome} />
        <Box
          component="main"
          sx={{
            flex: 1,
            paddingTop: isHome ? 0 : { xs: 56, md: 64 },
          }}
        >
          <Outlet />
        </Box>
        <Footer />
      </Box>
    </Page>
  );
};

export default MainLayout;