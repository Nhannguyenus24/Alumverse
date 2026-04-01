import { Outlet, useLocation, useMatches } from "react-router";
import { Box, Toolbar } from "@mui/material";
import Header from "../components/Header";
import Footer from "../components/Footer";

const MainLayout = () => {
  const location = useLocation();
  const matches = useMatches();
  
  const hideFooter = matches.some((m) => m.handle?.hideFooter);
  
  const isHomePage = location.pathname === "/";

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
        {/* Only render the spacer if we are NOT on the HomePage */}
        {!isHomePage && <Toolbar />}
        
        <Outlet />
      </Box>
      {!hideFooter && <Footer />}
    </Box>
  );
};

export default MainLayout;