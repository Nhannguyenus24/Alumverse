import { useState, useCallback, useEffect } from 'react';

/**
 * Manages cover image file selection state with automatic memory-leak cleanup.
 * Revokes the object URL when the component unmounts or when preview changes.
 */
const useCoverUpload = () => {
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const handleCoverUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
    }
  }, []);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { coverFile, coverPreview, handleCoverUpload };
};

export default useCoverUpload;
