import { LinearProgress, Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";

const ProgressBar = ({ 
  value, 
  showLabel = true, 
  color = "primary",
  variant = "determinate" 
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (variant === "indeterminate") {
      return;
    }

    if (value !== undefined) {
      setProgress(Math.min(100, Math.max(0, value)));
    } else {
      // Auto progress simulation
      const timer = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress === 100) {
            return 0;
          }
          const diff = Math.random() * 10;
          return Math.min(100, oldProgress + diff);
        });
      }, 200);
      return () => clearInterval(timer);
    }
  }, [value, variant]);

  return (
    <Box sx={{ width: "100%" }}>
      {showLabel && variant === "determinate" && (
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Progress
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {Math.round(progress)}%
          </Typography>
        </Box>
      )}
      <LinearProgress
        variant={variant}
        value={progress}
        color={color}
        sx={{
          height: 8,
          borderRadius: 4,
        }}
      />
    </Box>
  );
};

export default ProgressBar;
