import { useEffect, useRef } from 'react';
import { Pagination, Stack } from '@mui/material';

/**
 * Unified AppPagination Component
 * Provides consistent rounded-square styling and automatic smooth scroll-to-top on page change.
 */
const AppPagination = ({
  count = 1,
  page = 1,
  onChange,
  scrollToTop = true,
  top = 0,
  behavior = 'smooth',
  sx = {},
  ...props
}) => {
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (!scrollToTop) return;
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    window.scrollTo({ top, behavior });
  }, [page, top, behavior, scrollToTop]);

  if (!count || count <= 1) return null;

  return (
    <Stack direction="row" justifyContent="center" alignItems="center" sx={{ mt: 3.5, width: '100%', ...sx }}>
      <Pagination
        count={count}
        page={page}
        onChange={onChange}
        color="primary"
        shape="rounded"
        size="large"
        sx={{
          '& .MuiPaginationItem-root': {
            fontWeight: 700,
            minWidth: 38,
            height: 38,
          },
        }}
        {...props}
      />
    </Stack>
  );
};

export default AppPagination;
