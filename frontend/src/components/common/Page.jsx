import { Box, Container } from "@mui/material";

const Page = ({ 
  children, 
  maxWidth = "lg",
  sx = {},
  disableContainer = false 
}) => {
  if (disableContainer) {
    return <Box sx={{ ...sx }}>{children}</Box>;
  }

  return (
    <Container maxWidth={maxWidth} sx={{ py: 3, ...sx }}>
      {children}
    </Container>
  );
};

export default Page;