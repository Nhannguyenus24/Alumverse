import { useCallback, useEffect, useRef } from "react";

export default function usePaginationScrollToTop({ 
  currentPage, 
  setPage, 
  top = 0, 
  behavior = "smooth" }
) {
  const isFirstRenderRef = useRef(true);

  useEffect(() => {  // force to use because if not use, click on the arrow of pagination would not scroll to top, 
    // only when click to the page number would scroll to top
    // the reason is because: 
    // setPage(nextPage);        // React schedules re-render (async)
    // window.scrollTo({ ... }); // run immediately - at this time page has not been actually changed
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
