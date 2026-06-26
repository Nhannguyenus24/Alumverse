import { useState, useCallback, useEffect } from 'react';
import { fileToCroppedCoverBase64 } from '../utils/imageUtils';

const isObjectUrl = (url) => typeof url === 'string' && url.startsWith('blob:');

/**
 * Manages cover image file selection state with automatic memory-leak cleanup.
 * Revokes the object URL when the component unmounts or when preview changes.
 */
const useCoverUpload = () => {
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverCroppedPreview, setCoverCroppedPreview] = useState(null);
  const [coverPositionY, setCoverPositionY] = useState(50);

  const handleCoverUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview((prev) => {
        if (isObjectUrl(prev)) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      setCoverPositionY(50);
    }
  }, []);

  useEffect(() => {
    if (!coverFile) {
      setCoverCroppedPreview(null);
      return undefined;
    }

    let isCancelled = false;
    const timeout = window.setTimeout(async () => {
      try {
        const nextPreview = await fileToCroppedCoverBase64(coverFile, coverPositionY);
        if (!isCancelled) setCoverCroppedPreview(nextPreview);
      } catch {
        if (!isCancelled) setCoverCroppedPreview(coverPreview);
      }
    }, 80);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeout);
    };
  }, [coverFile, coverPositionY, coverPreview]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (isObjectUrl(coverPreview)) URL.revokeObjectURL(coverPreview);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    coverFile,
    coverPreview,
    coverCroppedPreview,
    coverPositionY,
    handleCoverUpload,
    setCoverPreview,
    setCoverPositionY,
  };
};

export default useCoverUpload;
