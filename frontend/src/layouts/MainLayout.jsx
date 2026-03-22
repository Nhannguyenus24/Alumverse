import { Outlet, useLocation } from "react-router";
import { Box, Container } from "@mui/material";
import Header from "../components/Header";
import Footer from "../components/Footer";

/** Routes that use full-height chat UI without site footer */
const FOOTER_HIDDEN_PREFIX = "/development/mentorship/chat";

const MainLayout = () => {
  const { pathname } = useLocation();
  const showFooter = !pathname.startsWith(FOOTER_HIDDEN_PREFIX);

  return (
      <Container
        maxWidth={false}
        disableGutters
        sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        <Header />
        <Box
          component="main"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            // Offset fixed AppBar (Header Toolbar: 56px xs, 64px md+)
            pt: { xs: '56px', md: '64px' },
          }}
        >
          <Outlet />
        </Box>
        {showFooter && <Footer />}
      </Container>
  );
};

export default MainLayout;
