import { Outlet, useLocation, useMatches } from "react-router";
import { Box, Toolbar } from "@mui/material";
import Header from "../components/Header";
import Footer from "../components/Footer";

const MainLayout = () => {
  const matches = useMatches();
  const hideFooter = matches.some((m) => m.handle?.hideFooter);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <Box
        component="main"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
      {!hideFooter && <Footer />}
    </Box>
  );
};

export default MainLayout;
