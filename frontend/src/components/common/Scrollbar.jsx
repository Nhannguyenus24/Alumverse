import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledScrollbar = styled(Box)(({ theme }) => ({
  "&::-webkit-scrollbar": {
    width: "8px",
    height: "8px",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: theme.palette.mode === "dark" 
      ? "rgba(255, 255, 255, 0.05)" 
      : "rgba(0, 0, 0, 0.05)",
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.mode === "dark"
      ? "rgba(255, 255, 255, 0.2)"
      : "rgba(0, 0, 0, 0.2)",
    borderRadius: "4px",
    "&:hover": {
      backgroundColor: theme.palette.mode === "dark"
        ? "rgba(255, 255, 255, 0.3)"
        : "rgba(0, 0, 0, 0.3)",
    },
  },
}));

const Scrollbar = ({ children, sx, ...props }) => {
  return (
    <StyledScrollbar
      sx={{
        overflow: "auto",
        ...sx,
      }}
      {...props}
    >
      {children}
    </StyledScrollbar>
  );
};

export default Scrollbar;