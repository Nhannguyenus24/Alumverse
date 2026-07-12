
const LoadingScreen = ({ message}) => {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "background.default",
        zIndex: 9999,
        "@keyframes dotBounce": {
          "0%, 80%, 100%": {
            transform: "translateY(0)",
            opacity: 0.6,
          },
          "40%": {
            transform: "translateY(-8px)",
            opacity: 1,
          },
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "primary.main",
              animation: "dotBounce 1s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </Box>
      {message && (
        <Typography
          variant="body1"
          sx={{ mt: 3, color: "text.secondary" }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingScreen;
