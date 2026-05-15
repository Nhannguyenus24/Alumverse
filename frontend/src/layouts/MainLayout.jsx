import { Outlet, useLocation, useMatches, useParams } from "react-router";
import { Box, Toolbar } from "@mui/material";
import Header from "../components/Header";
import Footer from "../components/Footer";

const MainLayout = () => {
  const location = useLocation();
  const matches = useMatches();
  const { slug } = useParams();

  const hideFooter = matches.some((m) => m.handle?.hideFooter);

  const normalizedPathname = (() => {
    if (!slug) return location.pathname;

    const slugPrefix = `/${slug}`;

    if (location.pathname === slugPrefix) return "/";

    if (location.pathname.startsWith(`${slugPrefix}/`)) {
      return location.pathname.slice(slugPrefix.length) || "/";
    }

    return location.pathname;
  })();

  const isHomePage = normalizedPathname === "/";

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
        {!isHomePage && <Toolbar />}

        <Outlet />
      </Box>

      {!hideFooter && <Footer />}
    </Box>
  );
};

export default MainLayout;