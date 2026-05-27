/* eslint-disable no-unused-vars */
import { Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";
import LoadingScreen from "../components/LoadingScreen";

export const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

/** Inline Suspense fallback in AuthLayout — avoids fullscreen LoadingScreen on logout → /auth/login */
const AuthRouteSuspenseFallback = () => (
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
    <CircularProgress size={36} thickness={4} aria-label="Loading" />
  </Box>
);

export const AuthLoadable = (Component) => (props) => (
  <Suspense fallback={<AuthRouteSuspenseFallback />}>
    <Component {...props} />
  </Suspense>
);

