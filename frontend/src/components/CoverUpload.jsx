import React from 'react';
import { Box, Button } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

const CoverUpload = ({ value, onChange, accept = "image/*" }) => {
  return (
    <Box
      sx={{
        height: { xs: 130, md: 180 },
        backgroundColor: 'primary.dark',
        backgroundImage: value ? `url(${value})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        p: 2,
      }}
    >
      <Button
        variant="outlined"
        component="label"
        startIcon={<PhotoCameraIcon />}
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          color: 'text.primary',
          '&:hover': { backgroundColor: '#fff' },
          textTransform: 'none',
          fontWeight: 600,
          // Sử dụng absolute để khớp với layout cũ của bạn
          position: 'absolute',
          top: 16,
          right: 16,
        }}
      >
        {value ? 'Sửa ảnh bìa' : 'Thêm ảnh bìa'}
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