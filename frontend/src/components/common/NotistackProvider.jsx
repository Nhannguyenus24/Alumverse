import { SnackbarProvider } from "notistack";
import { useRef } from "react";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const NotistackProvider = ({ children }) => {
  const notistackRef = useRef(null);

  const onClickDismiss = (key) => () => {
    notistackRef.current?.closeSnackbar(key);
  };

  return (
    <SnackbarProvider
      ref={notistackRef}
      maxSnack={3}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      action={(key) => (
        <IconButton
          size="small"
          aria-label="close"
          color="inherit"
          onClick={onClickDismiss(key)}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    >
      {children}
    </SnackbarProvider>
  );
};

export default NotistackProvider;