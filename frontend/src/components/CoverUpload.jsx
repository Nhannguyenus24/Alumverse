import React from 'react';
import { Box, Button } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

const CoverUpload = ({ value, onChange, accept = "image/*", heightSx }) => {
  return (
    <Box
      sx={{
        height: heightSx ?? { xs: '42vh', md: '56vh' },
        minHeight: { xs: 260, md: 420 },
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
          position: 'absolute',
          top: 16,
          right: 16,
        }}
      >
        {value ? 'Edit main photo' : 'Add main photo'}
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
