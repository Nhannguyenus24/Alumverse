import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';

/**
 * Combines a search input state with debouncing and an optional callback
 * that fires (with page reset) whenever the debounced value changes.
 *
 * @param {function} [onDebouncedChange] - Called with the debounced value. Also receives a resetPage fn.
 * @param {number} [delay=500] - Debounce delay in ms.
 */
const useSearchWithDebounce = (onDebouncedChange, delay = 500) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, delay);

  useEffect(() => {
    onDebouncedChange?.(debouncedSearch);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  return { searchTerm, setSearchTerm, debouncedSearch };
};

export default useSearchWithDebounce;
