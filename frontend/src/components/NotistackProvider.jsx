
import { useRef } from 'react';
import { styled } from '@mui/material/styles';
import { alpha, useTheme } from '@mui/material/styles';

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

function SnackbarStyles() {
  const theme = useTheme();

  return (
    <GlobalStyles
      styles={{
        '#root': {
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
