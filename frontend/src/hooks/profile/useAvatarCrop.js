// components/profile/useAvatarCrop.js

import { useState } from "react";

const AVATAR_OUTPUT_SIZE = 512;
const AVATAR_JPEG_QUALITY = 0.86;

export default function useAvatarCrop() {
  const [open, setOpen] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState(1);

  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!avatarPreview || !croppedAreaPixels) return;

    const image = new Image();
    image.src = avatarPreview;

    image.onload = () => {
      const canvas = document.createElement("canvas");

      canvas.width = AVATAR_OUTPUT_SIZE;
      canvas.height = AVATAR_OUTPUT_SIZE;

      const ctx = canvas.getContext("2d");

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        AVATAR_OUTPUT_SIZE,
        AVATAR_OUTPUT_SIZE
      );

      const croppedUrl = canvas.toDataURL("image/jpeg", AVATAR_JPEG_QUALITY);

      setAvatarUrl(croppedUrl);

      setOpen(false);
    };
  };

  return {
    open,
    setOpen,

    avatarUrl,
    avatarPreview,

    crop,
    zoom,

    setCrop,
    setZoom,

    handleFileChange,
    handleSave,

    setCroppedAreaPixels,
  };
}
