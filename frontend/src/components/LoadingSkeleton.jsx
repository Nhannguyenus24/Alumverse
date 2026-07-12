
const LoadingSkeleton = ({ count = 3 }) => {
  return (
    <Stack spacing={3} sx={{ width: '100%', py: 2, px: 1 }}>
      {Array.from({ length: count }).map((_, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* Avatar Skeleton */}
          <Skeleton variant="circular" width={50} height={50} animation="wave" />
          
          {/* Content Skeleton */}
          <Box sx={{ flex: 1, pt: 0.5 }}>
            <Skeleton variant="text" width="40%" height={24} animation="wave" sx={{ mb: 1 }} />
            <Skeleton variant="text" width="80%" height={20} animation="wave" />
            <Skeleton variant="text" width="60%" height={20} animation="wave" />
          </Box>
        </Box>
      ))}
    </Stack>
  );
};

export default LoadingSkeleton;
