import { Outlet } from "react-router";
import { Box } from "@mui/material";
import Page from "../components/common/Page";

const MainLayout = () => {
  return (
    <Page>
      <Box sx={{ minHeight: "100vh" }}>
        {/* Add your navigation/header here */}
        <Outlet />
        {/* Add your footer here */}
      </Box>
    </Page>
  );
};

export default MainLayout;