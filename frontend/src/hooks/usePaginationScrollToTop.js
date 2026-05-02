import { useCallback, useEffect, useRef } from "react";

export default function usePaginationScrollToTop({ 
  currentPage, 
  setPage, 
  top = 0, 
  behavior = "smooth" }
) {
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    window.scrollTo({top, behavior,});
  }, [currentPage, top, behavior]);

  return useCallback(
    (_, nextPage) => {
      if (nextPage === currentPage) return;
      setPage(nextPage);
    },
    [currentPage, setPage]
  );
}
