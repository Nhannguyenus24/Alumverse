
const Logo = ({ size = 'medium', variant = 'text', src, alt = 'Logo', sx, ...rest }) => {
  const sizes = {
    small: { fontSize: '1.5rem', height: 32 },
    medium: { fontSize: '2rem', height: 40 },
    large: { fontSize: '3rem', height: 60 },
    xlarge: { fontSize: '3.5rem', height: 96 },
  };

  const currentSize = sizes[size] || sizes.medium;

  if (variant === 'image' && src) {
    return (
      <Box
        component="img"
        src={src}
        alt={alt}
        sx={{
          height: currentSize.height,
          width: 'auto',
          display: 'block',
          cursor: 'pointer',
          ...sx,
        }}
        {...rest}
      />
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        cursor: 'pointer',
        ...sx,
      }}
      {...rest}
    >
      <Typography
        variant="h4"
        component="div"
        sx={{
          fontWeight: 700,
          fontSize: currentSize.fontSize,
          color: 'primary.main',
        }}
      >
        HCMUS Alumni
      </Typography>
    </Box>
  );
};

export default Logo;
