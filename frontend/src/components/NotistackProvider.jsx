
import { useCallback, useRef, useState } from 'react';
import { SnackbarProvider } from 'notistack';
import { styled } from '@mui/material/styles';
import { Box, GlobalStyles } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import Iconify from './Iconify';
import IconButtonAnimate from './IconButtonAnimate';
import ToastPositionContext from '../contexts/toastPositionContext';

// ------------------------------------------
// Override Material Design Content

import { MaterialDesignContent } from 'notistack';

const StyledMaterialDesignContent = styled(MaterialDesignContent)(({ theme }) => ({
  '&.notistack-MuiContent': {
    borderRadius: 12,
    padding: '2px 8px',
    backgroundColor: `${theme.palette.background.paper} !important`,
    color: `${theme.palette.text.primary} !important`,
    '& .SnackbarItem-message': {
      color: `${theme.palette.text.primary} !important`,
    },
    '& .notistack-MuiContent-message': {
      color: `${theme.palette.text.primary} !important`,
    },
  },
  '&.notistack-MuiContent-success': {
    backgroundColor: `${theme.palette.background.paper} !important`,
  },
  '&.notistack-MuiContent-error': {
    backgroundColor: `${theme.palette.background.paper} !important`,
  },
  '&.notistack-MuiContent-warning': {
    backgroundColor: `${theme.palette.background.paper} !important`,
  },
  '&.notistack-MuiContent-info': {
    backgroundColor: `${theme.palette.background.paper} !important`,
  },
}));

// ------------------------------------------

const DEFAULT_TOP_OFFSET = 14;

function SnackbarStyles({ topOffset }) {
  const theme = useTheme();

  return (
    <GlobalStyles
      styles={{
        '#root': {
          '& .notistack-SnackbarContainer': {
            top: `${DEFAULT_TOP_OFFSET + topOffset}px !important`,
          },
          '& .SnackbarItem-message': {
            padding: '0 !important',
            fontWeight: theme.typography.fontWeightMedium,
            color: `${theme.palette.text.primary} !important`,
          },
          '& .notistack-MuiContent': {
            color: `${theme.palette.text.primary} !important`,
          },
          '& .notistack-MuiContent-message': {
            color: `${theme.palette.text.primary} !important`,
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


export default function NotistackProvider({ children }) {
  const notistackRef = useRef(null);
  const offsetsRef = useRef(new Map());
  const [topOffset, setTopOffset] = useState(0);

  const registerToastTopOffset = useCallback((offset) => {
    const registrationId = Symbol('toast-top-offset');
    const normalizedOffset = Number.isFinite(offset) ? Math.max(0, offset) : 0;

    offsetsRef.current.set(registrationId, normalizedOffset);
    setTopOffset(Math.max(0, ...offsetsRef.current.values()));

    return () => {
      offsetsRef.current.delete(registrationId);
      setTopOffset(Math.max(0, ...offsetsRef.current.values()));
    };
  }, []);

  const onClose = (key) => () => {
    notistackRef.current.closeSnackbar(key);
  };

  return (
    <ToastPositionContext.Provider value={registerToastTopOffset}>
      <SnackbarStyles topOffset={topOffset} />

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
    </ToastPositionContext.Provider>
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
