import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { useSnackbar } from 'notistack';
import { useDebounce } from '../useDebounce';

/**
 * Common setup hook for admin pages.
 * Handles breadcrumb registration, snackbar access, and debounced search.
 *
 * @param {string} breadcrumbLabel - The label shown in the admin breadcrumb.
 * @param {number} [debounceDelay=500] - Debounce delay for search input.
 */
const useAdminPageSetup = (breadcrumbLabel, debounceDelay = 500) => {
  const { enqueueSnackbar } = useSnackbar();
  const { setBreadcrumbs } = useOutletContext();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, debounceDelay);

  useEffect(() => {
    setBreadcrumbs?.([{ label: breadcrumbLabel, active: true }]);
  }, [setBreadcrumbs, breadcrumbLabel]);

  return { enqueueSnackbar, searchTerm, setSearchTerm, debouncedSearch };
};

export default useAdminPageSetup;
