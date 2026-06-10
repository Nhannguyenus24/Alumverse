import {
  Avatar,
  Box,
  Button,
  Card,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import { alpha } from '@mui/material/styles';
import IconButtonMenu from '../IconButtonMenu';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { formatAcademicValue } from './networkCardUtils';

const NetworkConnectionCard = ({
  connection,
  enableBlock = true,
  onBlock,
  isBlockLoading = false,
}) => {
  const navigate = useOrgNavigate();
  const displayName = connection.fullName || 'N/A';
  const programLabel = formatAcademicValue(connection.program, '—');
  const majorLabel = formatAcademicValue(connection.major, 'N/A');

  const handleMessage = () => {
    navigate('/chat');
  };

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.2s',
        position: 'relative',
        '&:hover': { transform: 'translateY(-4px)' },
      }}
    >
      {enableBlock ? (
        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
          <IconButtonMenu
            menuId={`network-connection-card-menu-${connection.peerMemberId}`}
            buttonAriaLabel="Tùy chọn kết nối"
          >
            {({ close }) => (
              <MenuItem
                disabled={isBlockLoading}
                onClick={() => {
                  close();
                  onBlock?.();
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <BlockOutlinedIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText primary="Chặn người dùng" primaryTypographyProps={{ variant: 'body2' }} />
              </MenuItem>
            )}
          </IconButtonMenu>
        </Box>
      ) : null}

      <Stack spacing={1.5} alignItems="center">
        <Avatar src={connection.avatarUrl} sx={{ width: 80, height: 80 }} />

        <Box sx={{ width: '100%' }}>
          <Typography fontWeight={700} variant="subtitle1" sx={{ lineHeight: 1.3 }}>
            {displayName}
          </Typography>

          <Box
            sx={(theme) => ({
              mt: 1.25,
              width: '100%',
              px: 1.25,
              py: 1.25,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.18),
            })}
          >
            <Stack spacing={0.75} alignItems="center">
              <Typography variant="body2" sx={{ color: 'primary.dark', fontWeight: 500 }}>
                Program:{' '}
                <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
                  {programLabel}
                </Box>
              </Typography>
              <Typography variant="body2" sx={{ color: 'primary.dark', fontWeight: 500 }}>
                Major:{' '}
                <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
                  {majorLabel}
                </Box>
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Stack>

      <Button variant="contained" sx={{ mt: 3 }} fullWidth type="button" onClick={handleMessage}>
        Nhắn tin
      </Button>
    </Card>
  );
};

export default NetworkConnectionCard;
