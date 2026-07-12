 

// eslint-disable-next-line no-unused-vars
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

// eslint-disable-next-line no-unused-vars
export const AuthLoadable = (Component) => (props) => (
  <Suspense fallback={<AuthRouteSuspenseFallback />}>
    <Component {...props} />
  </Suspense>
);

