import React, { createContext, useState, useEffect, useCallback } from 'react';

export const OrganizationContext = createContext(null);

export const OrganizationProvider = ({ children, slug }) => {
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize organization from localStorage or fetch from API
  const initializeOrganization = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Check localStorage first
      const storageKey = `org_${slug}`;
      const cachedOrg = localStorage.getItem(storageKey);

      if (cachedOrg) {
        try {
          const parsedOrg = JSON.parse(cachedOrg);
          setOrganization(parsedOrg);
          setLoading(false);
          return;
        } catch (e) {
          console.warn('Failed to parse cached organization:', e);
          localStorage.removeItem(storageKey);
        }
      }

      // Fetch from backend if not in localStorage
      const response = await fetch(`/api/organizations/${slug}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError({ status: 403, message: 'Organization not found' });
        } else {
          setError({ 
            status: response.status, 
            message: `Failed to load organization: ${response.statusText}` 
          });
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      const orgData = data.data; // ApiResponse contains data field

      // Store in localStorage
      localStorage.setItem(storageKey, JSON.stringify(orgData));
      setOrganization(orgData);
      setError(null);
    } catch (err) {
      console.error('Error initializing organization:', err);
      setError({ 
        status: 500, 
        message: 'Failed to load organization' 
      });
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      initializeOrganization();
    }
  }, [slug, initializeOrganization]);

  const value = {
    organization,
    loading,
    error,
    slug,
    refreshOrganization: initializeOrganization,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};
