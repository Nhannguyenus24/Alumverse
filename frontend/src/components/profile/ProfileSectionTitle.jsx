
const ProfileSectionTitle = ({ icon, children, sx }) => {
  const titleIcon = icon ? <Box component={icon} /> : null;

  return (
    <Typography
      variant="h5"
      fontWeight={800}
      color="primary.main"
      mb={2}
      display="flex"
      alignItems="center"
      gap={1}
      sx={sx}
    >
      {titleIcon} {children}
    </Typography>
  );
};

export default ProfileSectionTitle;
