import { useEffect, useMemo } from "react";
import { Outlet, useLocation, useMatches, useParams } from "react-router";
import { Box } from "@mui/material";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingChatActions from "../components/FloatingChatActions";
import { getNormalizedPathname } from "../utils/pathUtils";
import { HEADER_HEIGHT } from "../constants/layout";

const MainLayout = () => {
  const location = useLocation();
  const matches = useMatches();
  const { slug } = useParams();

  const hideFooter = matches.some((m) => m.handle?.hideFooter);

  const normalizedPathname = getNormalizedPathname(location.pathname, slug);

  const isHomePage = normalizedPathname === "/";
  const isSlugAdminRoute = normalizedPathname === "/admin" || normalizedPathname.startsWith("/admin/");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search]);

  const headerElement = useMemo(() => <Header />, []);
  const footerElement = useMemo(() => <Footer />, []);
  const floatingChatActionsElement = useMemo(() => <FloatingChatActions />, []);
  const toolbarElement = useMemo(
    () => <Box sx={{ height: HEADER_HEIGHT, flexShrink: 0 }} />,
    []
  );

  if (isSlugAdminRoute) {
    return <Outlet />;
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {headerElement}

      <Box
        component="main"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {!isHomePage && toolbarElement}

        <Outlet />
      </Box>

      {!hideFooter && footerElement}

      {floatingChatActionsElement}
    </Box>
  );
};

export default MainLayout;
