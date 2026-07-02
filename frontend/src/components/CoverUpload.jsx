import React, { useRef } from 'react';
import { Box, Button, Typography } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import SwapVertIcon from '@mui/icons-material/SwapVert';

const CoverUpload = ({
  value,
  onChange,
  accept = "image/*",
  heightSx,
  minHeightSx,
  positionY = 50,
  onPositionYChange,
  editLabel = 'Sửa ảnh đại diện',
  addLabel = 'Thêm ảnh đại diện',
}) => {
  const dragRef = useRef(null);
  const updatePosition = (nextPosition) => {
    onPositionYChange?.(Math.min(100, Math.max(0, nextPosition)));
  };
  const handlePointerDown = (event) => {
    if (!value || !onPositionYChange || event.target.closest('button, input')) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = { startY: event.clientY, startPosition: positionY };
  };
  const handlePointerMove = (event) => {
    if (!dragRef.current) return;
    const height = event.currentTarget.getBoundingClientRect().height || 1;
    const deltaPercent = ((event.clientY - dragRef.current.startY) / height) * 100;
    updatePosition(dragRef.current.startPosition + deltaPercent);
  };
  const handlePointerUp = (event) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <Box
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      sx={{
        height: heightSx ?? { xs: '42vh', md: '56vh' },
        minHeight: minHeightSx ?? { xs: 260, md: 420 },
        backgroundColor: 'primary.dark',
        backgroundImage: value ? `url(${value})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: `center ${positionY}%`,
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        p: 2,
        cursor: value && onPositionYChange ? 'ns-resize' : 'default',
        touchAction: 'none',
      }}
    >
      {value && onPositionYChange ? (
        <Box
          sx={{
            position: 'absolute',
            left: { xs: 16, md: 32 },
            top: { xs: 24, md: 32 },
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: { xs: 1.25, sm: 1.75 },
            py: 0.75,
            borderRadius: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: 'grey.900',
            boxShadow: 2,
            pointerEvents: 'none',
            zIndex: 1,
            maxWidth: { xs: 'calc(100% - 190px)', sm: 'calc(100% - 240px)', md: 'calc(100% - 320px)' },
          }}
        >
          <SwapVertIcon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Kéo ảnh lên/xuống để căn khung
          </Typography>
        </Box>
      ) : null}
      <Button
        variant="outlined"
        component="label"
        startIcon={<PhotoCameraIcon />}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerMove={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          color: 'grey.900',
          borderColor: 'rgba(0, 0, 0, 0.22)',
          '&:hover': { backgroundColor: '#fff', borderColor: 'primary.main' },
          textTransform: 'none',
          fontWeight: 600,
          position: 'absolute',
          top: { xs: 24, md: 32 },
          right: { xs: 16, md: 32 },
          zIndex: 2,
        }}
      >
        {value ? editLabel : addLabel}
        <input
          hidden
          type="file"
          accept={accept}
          onChange={(e) => {
            onChange(e);
            e.target.value = null;
          }}
        />
      </Button>
    </Box>
  );
};

export default CoverUpload;
