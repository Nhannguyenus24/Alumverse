import PropTypes from 'prop-types';
import { useRef } from 'react';
import { SnackbarProvider } from 'notistack';
import { styled } from '@mui/material/styles';
import { Box, GlobalStyles } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import Iconify from './Iconify';
import IconButtonAnimate from './IconButtonAnimate';

// ------------------------------------------
// Override Material Design Content

import { MaterialDesignContent } from 'notistack';

const StyledMaterialDesignContent = styled(MaterialDesignContent)(() => ({
  '&.notistack-MuiContent': {
    borderRadius: 12,
    padding: '2px 8px',
    color: '#111111 !important',
    '& .SnackbarItem-message': {
      color: '#111111 !important',
    },
    '& .notistack-MuiContent-message': {
      color: '#111111 !important',
    },
  },
  '&.notistack-MuiContent-success': {
    backgroundColor: '#FFFFFF',
  },
  '&.notistack-MuiContent-error': {
    backgroundColor: '#FFFFFF',
  },
  '&.notistack-MuiContent-warning': {
    backgroundColor: '#FFFFFF',
  },
  '&.notistack-MuiContent-info': {
    backgroundColor: '#FFFFFF',
  },
}));

// ------------------------------------------

function SnackbarStyles() {
  const theme = useTheme();

  return (
    <GlobalStyles
      styles={{
        '#root': {
          '& .SnackbarItem-message': {
            padding: '0 !important',
            fontWeight: theme.typography.fontWeightMedium,
            color: '#111111 !important',
          },
          '& .notistack-MuiContent': {
            color: '#111111 !important',
          },
          '& .notistack-MuiContent-message': {
            color: '#111111 !important',
          },
          '& .SnackbarItem-action': {
            marginRight: 0,
            color: theme.palette.action.active,
            '& svg': { width: 18, height: 18 },
          },
        },
      }}
    />
  );
}

NotistackProvider.propTypes = {
  children: PropTypes.node,
};

export default function NotistackProvider({ children }) {
  const notistackRef = useRef(null);

  const onClose = (key) => () => {
    notistackRef.current.closeSnackbar(key);
  };

  return (
    <>
      <SnackbarStyles />
      
      <SnackbarProvider
        ref={notistackRef}
        dense
        maxSnack={5}
        autoHideDuration={2000}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        Components={{
          success: StyledMaterialDesignContent,
          error: StyledMaterialDesignContent,
          warning: StyledMaterialDesignContent,
          info: StyledMaterialDesignContent,
        }}
        iconVariant={{
          info: <SnackbarIcon icon={'eva:info-fill'} color="info" />,
          success: <SnackbarIcon icon={'eva:checkmark-circle-2-fill'} color="success" />,
          warning: <SnackbarIcon icon={'eva:alert-triangle-fill'} color="warning" />,
          error: <SnackbarIcon icon={'eva:alert-circle-fill'} color="error" />,
        }}
        action={(key) => (
          <IconButtonAnimate size="small" onClick={onClose(key)} sx={{ p: 0.5 }}>
            <Iconify icon={'eva:close-fill'} />
          </IconButtonAnimate>
        )}
      >
        {children}
      </SnackbarProvider>
    </>
  );
}

function SnackbarIcon({ icon, color }) {
  return (
    <Box
      component="span"
      sx={{
        mr: 1.5,
        width: 40,
        height: 40,
        display: 'flex',
        borderRadius: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        color: `${color}.main`,
        bgcolor: (theme) => alpha(theme.palette[color].main, 0.16),
      }}
    >
      <Iconify icon={icon} width={24} height={24} />
    </Box>
  );
}