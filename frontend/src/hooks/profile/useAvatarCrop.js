// components/profile/useAvatarCrop.js

import { useState } from "react";

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

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      const ctx = canvas.getContext("2d");

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      const croppedUrl = canvas.toDataURL("image/jpeg");

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