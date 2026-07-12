import { alpha } from "@mui/material";

const MentorshipTag = ({ label, sx = {} }) => {
  return (
    <Box
      sx={(theme) => ({
        px: 1.2,
        py: 0.75,
        borderRadius: "999px",
        backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.16 : 0.1),
        border: "1px solid",
        borderColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.34 : 0.22),
        display: "inline-flex", // Thay đổi thành inline-flex để tag co giãn theo text
        alignItems: "center",
        justifyContent: "center",
        ...sx, // Cho phép ghi đè style nếu cần
      })}
    >
      <Typography
        variant="caption"
        color="primary.main"
        fontWeight={600}
        sx={{
          lineHeight: 1,
          textAlign: "center",
          wordBreak: "break-word",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};

export default MentorshipTag;
