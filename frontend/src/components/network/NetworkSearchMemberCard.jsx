import { Avatar, Box, Button, Card, CircularProgress, ListItemIcon, ListItemText, MenuItem, Stack, Typography } from '@mui/material';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import { alpha } from '@mui/material/styles';

import IconButtonMenu from '../IconButtonMenu';
import { useNetworkMemberProfileNavigation } from '../../hooks/network/useNetworkMemberProfileNavigation';
import { networkCardClickableSx } from './networkCardUtils';

/**
 * Card hiển thị một thành viên trong tab Tìm kiếm Network.
 * Dữ liệu: global_profiles (fullName), users (avatar), organization_members (program, major).
 */
const NetworkSearchMemberCard = ({
  userId,
  avatar,
  fullName,
  program,
  major,
  onMessage,
  onBlock,
  isDemo = false,
  isMessageLoading = false,
  isBlockLoading = false,
}) => {
  const { navigateToProfile, handleCardKeyDown, stopActionPropagation } =
    useNetworkMemberProfileNavigation(userId);
  const displayName = fullName || 'N/A';
  const programLabel = formatAcademicValue(program, '—');
  const majorLabel = formatAcademicValue(major, 'N/A');

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={navigateToProfile}
      onKeyDown={handleCardKeyDown}
      sx={{
        p: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: isDemo ? 'primary.light' : 'divider',
        boxShadow: 'none',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.2s',
        position: 'relative',
        ...networkCardClickableSx,
        '&:hover': { transform: 'translateY(-4px)' },
      }}
    >
      {onBlock ? (
        <Box sx={{ position: 'absolute', top: 8, right: 8 }} onClick={stopActionPropagation}>
          <IconButtonMenu
            menuId={`network-member-card-menu-${fullName}`}
            buttonAriaLabel="Tùy chọn thành viên"
          >
            {({ close }) => (
              <MenuItem
                disabled={isBlockLoading}
                onClick={(event) => {
                  stopActionPropagation(event);
                  close();
                  onBlock();
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
        <Avatar src={avatar} sx={{ width: 80, height: 80 }} />

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

      <Button
        variant="contained"
        sx={{ mt: 3 }}
        fullWidth
        type="button"
        onClick={(event) => {
          stopActionPropagation(event);
          onMessage?.();
        }}
        disabled={!onMessage || isMessageLoading}
      >
        {isMessageLoading ? (
          <CircularProgress size={22} color="inherit" />
        ) : (
          'Nhắn tin'
        )}
      </Button>
    </Card>
  );
};

function formatAcademicValue(value, fallback) {
  if (Array.isArray(value)) {
    const items = value.filter(Boolean);
    return items.length > 0 ? items.join(' · ') : fallback;
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        const items = parsed.filter(Boolean);
        return items.length > 0 ? items.join(' · ') : fallback;
      }
    } catch {
      return value;
    }
    return value;
  }

  return fallback;
}

export default NetworkSearchMemberCard;
